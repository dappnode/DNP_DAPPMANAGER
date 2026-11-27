import * as isIPFS from "is-ipfs";
import { IPFSEntry } from "kubo-rpc-client";
import { CID } from "multiformats/cid";
import * as dagPb from "@ipld/dag-pb";
import { sha256 } from "multiformats/hashes/sha2";
import path from "path";
import {
  ReleaseSignature,
  TrustedReleaseKey,
  defaultArch,
  ReleaseSignatureStatusCode,
  releaseFilesToDownload,
  ReleaseSignatureStatus,
  DistributedFile,
  FileConfig,
  FileFormat,
  PackageRelease,
  releaseFiles,
  Manifest,
  Compose,
  Architecture
} from "@dappnode/types";
import YAML from "yaml";
import { ApmRepository } from "./apmRepository.js";
import { getReleaseSignatureStatus, serializeIpfsDirectory } from "./releaseSignature.js";
import { isEnsDomain } from "../isEnsDomain.js";
import { dappnodeRegistry } from "./params.js";
import { JsonRpcApiProvider } from "ethers";
import { MirrorOptions, MirrorFileEntry, HttpMirrorProvider } from "./contentProvider/index.js";
import { IpfsGatewayClient } from "./ipfsGatewayClient.js";
import { ContentLog, errorMessage, noopLog } from "./log.js";
import { SMALL_REQUEST, TransportError, TransportPolicy, TransportPolicyOptions } from "./transport.js";
import { CAR_ACCEPT, blockKey, concat, exportSingleFile, verifiedCarBlocks } from "./verifiedCar.js";
import { downloadFileResumable } from "./resumableDownload.js";

const source = "ipfs" as const;
const MAX_CAR_OVERHEAD_BYTES = 1024 * 1024;

/**
 * Discriminated union returned by listWithIpfsFallback. Avoids placeholder CIDs in the mirror path.
 * The mirror variant carries a memoised lazy lookup of the IPFS listing, used to resolve individual
 * file CIDs by filename when a mirror download fails or the mirror is disabled after listing.
 */
type ListResult =
  | { source: "mirror"; files: MirrorFileEntry[]; packageCidStr: string; ipfsEntries: () => Promise<IPFSEntry[]> }
  | { source: "ipfs"; entries: IPFSEntry[]; packageCidStr: string };

/**
 * The DappnodeRepository class extends ApmRepository class to provide methods to interact with the IPFS network.
 * To fetch IPFS content it uses dag endpoint for CAR content validation.
 *
 * A mirror provider is always configured. Whether it is used is determined at call time by invoking
 * isMirrorEnabled() — typically a direct read from the DB, so there is a single source of truth.
 * When disabled, all downloads fall back to IPFS directly. When enabled, the mirror is tried first and
 * IPFS is used as fallback. The mirror does not provide individual file CIDs, so signature verification
 * is skipped for mirror-listed packages (signedSafe = true, signatureStatus = notSigned).
 *
 * Provider priority (easy to swap — search for "Provider 1" and "Provider 2"):
 *   1. Mirror HTTP (if isMirrorEnabled())
 *   2. IPFS fallback (DAG-PB listing + CAR downloads)
 *
 * @extends ApmRepository
 */
export class DappnodeRepository extends ApmRepository {
  private readonly ipfsGatewayClient: IpfsGatewayClient;
  protected localIpfsUrl = "http://ipfs.dappnode:5001";
  private readonly mirrorProvider: HttpMirrorProvider;
  private readonly isMirrorEnabled: () => boolean;
  private readonly log: ContentLog;

  /**
   * Constructs an instance of DappnodeRepository.
   * @param ipfsUrl - The URL of the IPFS gateway.
   * @param provider - Ethereum JSON-RPC provider for ENS/APM resolution.
   * @param mirrorOptions - Mirror HTTP provider configuration (baseUrl, timeouts, size limits).
   * @param isMirrorEnabled - Called before each operation to decide whether to use the mirror.
   * @param log - Log callback shared by the IPFS gateway client and the mirror provider.
   * @param transportOptions - Shared transport policy options (e.g. headers timeout), mostly for tests.
   */
  constructor(
    ipfsUrl: string | string[],
    provider: JsonRpcApiProvider,
    mirrorOptions: MirrorOptions,
    isMirrorEnabled: () => boolean,
    log: ContentLog = noopLog,
    transportOptions: TransportPolicyOptions = {}
  ) {
    super(provider);
    this.log = log;
    // One policy for both providers, so the per-host concurrency limit is shared.
    const policy = new TransportPolicy(transportOptions);
    this.ipfsGatewayClient = new IpfsGatewayClient(ipfsUrl, log, policy);
    this.mirrorProvider = new HttpMirrorProvider(mirrorOptions, log, policy);
    this.isMirrorEnabled = isMirrorEnabled;
  }

  /**
   * Changes the IPFS provider and target.
   * @param ipfsUrl - The new URL of the IPFS network node.
   */
  public changeIpfsGatewayUrl(ipfsUrl: string | string[]): void {
    this.ipfsGatewayClient.setGatewayUrls(ipfsUrl);
  }

  /**
   * Pin content to local IPFS node
   */
  public async pinAddLocal(hash: string): Promise<void> {
    const res = await fetch(`${this.localIpfsUrl}/api/v0/pin/add?arg=${hash}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw Error(`Error pinning ${hash}: ${res.status} ${await res.text().catch(() => "")}`.trim());
  }

  /**
   * Unpin content from local IPFS node
   */
  public async pinRmLocal(hash: string): Promise<void> {
    const res = await fetch(`${this.localIpfsUrl}/api/v0/pin/rm?arg=${hash}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) throw Error(`Error unpinning ${hash}: ${res.status} ${await res.text().catch(() => "")}`.trim());
  }

  /**
   * Get multiple release assets for multiple requests
   * @param packages - A dictionary of packages and their versions
   * @returns - An array of release packages
   */
  public async getPkgsReleases(
    packages: {
      [name: string]: string;
    },
    trustedKeys: TrustedReleaseKey[],
    os?: NodeJS.Architecture
  ): Promise<PackageRelease[]> {
    return await Promise.all(
      Object.entries(packages).map(
        async ([name, version]) =>
          await this.getPkgRelease({
            dnpNameOrHash: name,
            trustedKeys,
            os,
            version
          })
      )
    );
  }

  public async getManifestFromDir(dnpName: string, version?: string): Promise<Manifest> {
    const { contentUri } = await this.getVersionAndIpfsHash({
      dnpNameOrHash: dnpName,
      version
    });

    const listResult = await this.listWithIpfsFallback(contentUri);
    const manifest = await this.getPkgAsset<Manifest>(releaseFilesToDownload.manifest, listResult);

    if (!manifest) throw Error(`Invalid pkg release ${contentUri}, manifest not found`);

    return manifest;
  }

  /**
   * Get all the assets for a request.
   * @param param0 - Object containing package name, version and architecture
   * @returns - The release package for the request
   */
  public async getPkgRelease({
    dnpNameOrHash,
    trustedKeys,
    os = "x64",
    version
  }: {
    dnpNameOrHash: string;
    trustedKeys: TrustedReleaseKey[];
    os?: NodeJS.Architecture;
    version?: string;
  }): Promise<PackageRelease> {
    const { contentUri, origin } = await this.getVersionAndIpfsHash({
      dnpNameOrHash,
      version
    });
    if (!isIPFS.cid(this.sanitizeIpfsPath(contentUri))) throw Error(`Invalid IPFS hash ${contentUri}`);

    const listResult = await this.listWithIpfsFallback(contentUri);

    // get manifest
    const manifest = await this.getPkgAsset<Manifest>(releaseFilesToDownload.manifest, listResult);
    // Ensure its a directory release
    if (!manifest) throw Error(`Invalid pkg release ${contentUri}, manifest not found`);
    const dnpName = manifest.name;
    const isCore = manifest.type === "dncore";

    // get compose
    const compose = await this.getPkgAsset<Compose>(releaseFilesToDownload.compose, listResult);
    if (!compose) throw Error(`Invalid pkg release ${contentUri}, compose not found`);

    // Signature verification requires individual file CIDs from IPFS DAG-PB listing.
    // Mirror listings have no individual CIDs, so verification is skipped.
    // Packages sourced from the mirror are trusted by the mirror operator (signedSafe = true).
    const signature: ReleaseSignature | undefined =
      listResult.source === "ipfs"
        ? await this.getPkgAsset<ReleaseSignature>(releaseFilesToDownload.signature, listResult)
        : undefined;

    const signatureStatus: ReleaseSignatureStatus =
      listResult.source === "ipfs" && signature
        ? getReleaseSignatureStatus(
            manifest.name,
            {
              signature,
              signedData: serializeIpfsDirectory(listResult.entries, signature.cid)
            },
            trustedKeys
          )
        : { status: ReleaseSignatureStatusCode.notSigned };

    const signedSafe =
      listResult.source === "mirror" ? true : signatureStatus.status === ReleaseSignatureStatusCode.signedByKnownKey;

    // Avatar: look up by filename regex; source drives which DistributedFile shape to use
    let avatarFile: DistributedFile | undefined;
    if (listResult.source === "mirror") {
      const entry = listResult.files.find((f) => releaseFiles.avatar.regex.test(f.name));
      if (entry)
        avatarFile = {
          hash: listResult.packageCidStr,
          size: entry.size,
          source: "mirror",
          filename: entry.name,
          packageHash: listResult.packageCidStr
        };
    } else {
      const entry = listResult.entries.find((e) => releaseFiles.avatar.regex.test(e.name));
      if (entry) avatarFile = { hash: entry.cid.toString(), size: entry.size, source };
    }

    return {
      dnpName,
      reqVersion: origin || manifest.version,
      semVersion: manifest.version,
      isCore,
      origin,
      imageFile: this.getImageByArch(manifest, listResult, os),
      avatarFile,
      manifest,
      setupWizard: await this.getPkgAsset(releaseFilesToDownload.setupWizard, listResult),
      compose,
      signature,
      signatureStatus,
      signedSafe,
      warnings: {
        coreFromForeignRegistry: isCore && !dnpName.endsWith(dappnodeRegistry),
        requestNameMismatch: isEnsDomain(dnpNameOrHash) && dnpNameOrHash !== dnpName
      },
      disclaimer: await this.getPkgAsset(releaseFilesToDownload.disclaimer, listResult),
      gettingStarted: await this.getPkgAsset(releaseFilesToDownload.gettingStarted, listResult),
      prometheusTargets: await this.getPkgAsset(releaseFilesToDownload.prometheusTargets, listResult),
      grafanaDashboards: await this.getPkgAsset(releaseFilesToDownload.grafanaDashboards, listResult),
      notifications: await this.getPkgAsset(releaseFilesToDownload.notifications, listResult)
    };
  }

  /**
   * Finds and downloads release assets matching a file config from either mirror or IPFS.
   *
   * @param fileConfig - Describes which file(s) to look for and how to parse them.
   * @param listResult - The directory listing (mirror or IPFS) to search in.
   * @throws If a required file is not found.
   */
  public async getPkgAsset<T>(fileConfig: FileConfig, listResult: ListResult): Promise<T | undefined> {
    const { regex, required, multiple, maxSize: maxLength, format } = fileConfig;

    const fileNames =
      listResult.source === "mirror" ? listResult.files.map((f) => f.name) : listResult.entries.map((e) => e.name);

    const matchingFiles = fileNames.filter((name) => regex.test(name));

    if (matchingFiles.length === 0) {
      if (required) throw new Error(`Missing required file: ${regex}`);
      return undefined;
    }

    const contents = await Promise.all(
      matchingFiles.map((name) =>
        this.downloadReleaseAsset(
          name,
          listResult.packageCidStr,
          () => this.resolveFileCid(listResult, name),
          maxLength
        )
      )
    );

    return this.parseAsset<T>(multiple ? contents : contents[0], format);
  }

  /**
   * Fetches a size-bounded IPFS file by CID into memory as bytes.
   * Does not attempt mirror routing — use downloadReleaseAsset for release files.
   */
  public async writeFileToBytes(hash: string, maxLength?: number, gatewayTimeoutMs?: number): Promise<Uint8Array> {
    return this.fetchVerifiedFile(this.sanitizeIpfsPath(hash), maxLength, gatewayTimeoutMs);
  }

  /**
   * Fetches an IPFS file by CID into memory as UTF-8 text. Used ONLY by
   * ipfsTest to verify IPFS connectivity.
   */
  public async writeFileToMemory(hash: string, maxLength?: number): Promise<string> {
    return new TextDecoder("utf-8").decode(await this.writeFileToBytes(hash, maxLength));
  }

  /**
   * Resolves the individual file CID of a release file. For mirror-listed packages the IPFS
   * directory listing is fetched lazily (once per listing) and the file is looked up by name.
   */
  private async resolveFileCid(listResult: ListResult, filename: string): Promise<string> {
    const entries = listResult.source === "ipfs" ? listResult.entries : await listResult.ipfsEntries();
    return findEntryCid(entries, filename, listResult.packageCidStr);
  }

  /**
   * Downloads a release file into memory. Tries mirror first (if configured),
   * then falls back to an IPFS CAR of the individual file.
   *
   * @param filename - Filename within the package (mirror routing).
   * @param packageCidStr - Package directory CID (mirror routing: /{packageCidStr}/{filename}).
   * @param resolveFileCid - Resolves the individual file CID, only called when the IPFS fallback is needed.
   * @param maxLength - Maximum file size in bytes.
   */
  private async downloadReleaseAsset(
    filename: string,
    packageCidStr: string,
    resolveFileCid: () => Promise<string>,
    maxLength?: number
  ): Promise<string> {
    // Provider 1: Mirror — try first if configured
    if (this.isMirrorEnabled()) {
      const mirrorCid = this.sanitizeIpfsPath(packageCidStr);
      const result = await this.mirrorProvider.fetchFile(mirrorCid, filename, { maxBytes: maxLength });
      if (result.status === "success") {
        return new TextDecoder("utf-8").decode(result.bytes);
      }
    }

    // Provider 2: IPFS CAR of the individual file
    const cidStr = this.sanitizeIpfsPath(await resolveFileCid());
    const bytes = await this.fetchVerifiedFile(cidStr, maxLength);

    // TODO: This assumes the data is UTF-8 encoded. If it's not, you will need a more complex conversion. Research which encoding is used by IPFS.
    return new TextDecoder("utf-8").decode(bytes);
  }

  /**
   * Downloads the content pointed by the given hash and writes it directly to the filesystem.
   * This function is intended for large files, such as Docker images.
   *
   * Provider priority:
   *   1. Mirror — streams directly to disk (no RAM buffering) if enabled and filename + packageHash are provided
   *   2. IPFS CAR — via the configured gateways
   *
   * When `filename` and `packageHash` are provided the file was listed by the mirror and `hash` is only a
   * placeholder (the release directory CID). The IPFS fallback then resolves the real file CID from the
   * IPFS directory listing of `packageHash`.
   *
   * IMPORTANT: This function is not supported in the browser.
   *
   * @param args.hash - Individual file CID, or a placeholder when filename + packageHash are provided.
   * @param args.path - The absolute path where the file will be written.
   * @param args.timeout - Optional cap on each IPFS gateway attempt in milliseconds. By default large
   *   downloads have no total cap; only stalls (no data received for a while) abort an attempt.
   * @param args.fileSize - Expected size of the file in bytes (for IPFS progress reporting).
   * @param args.progress - Optional function to call with the download progress.
   * @param args.filename - Filename within the package (used for mirror URL construction).
   * @param args.packageHash - Package directory CID (used for mirror URL: /{packageHash}/{filename}).
   */
  public async writeFileToFs({
    hash,
    path: _path,
    timeout,
    fileSize,
    progress,
    filename,
    packageHash
  }: {
    hash: string;
    path: string;
    timeout?: number;
    fileSize?: number;
    progress?: (n: number) => void;
    filename?: string;
    packageHash?: string;
  }): Promise<void> {
    if (!_path || _path.startsWith("/ipfs/") || !path.isAbsolute(_path)) throw Error(`Invalid path: "${_path}"`);

    // Progress stays monotonic when the mirror fails part-way and IPFS takes over
    let lastProgress = -1;
    const onProgress = progress
      ? (percent: number): void => {
          if (percent <= lastProgress) return;
          lastProgress = percent;
          progress(percent);
        }
      : undefined;

    // Provider 1: Mirror — stream directly to disk to avoid OOM on large Docker images
    if (filename && packageHash && this.isMirrorEnabled()) {
      const mirrorCid = this.sanitizeIpfsPath(packageHash);
      const result = await this.mirrorProvider.fetchFileToPath(mirrorCid, filename, _path, {
        onProgress
      });
      if (result.status === "success") return;
      this.log("warn", `Mirror download of ${filename} failed (${result.reason}), falling back to IPFS`);
    }

    // Provider 2: IPFS — fallback (or primary when mirror is not configured)
    let cidStr = this.sanitizeIpfsPath(hash.toString());
    let expectedSize = fileSize;
    if (filename && packageHash) {
      const entries = await this.list(packageHash);
      cidStr = this.sanitizeIpfsPath(findEntryCid(entries, filename, packageHash));
      // The directory link size (Tsize, the sum of block sizes) is what IPFS progress is measured against
      expectedSize = entries.find((entry) => entry.name === filename)?.size ?? fileSize;
    }

    await downloadFileResumable({
      client: this.ipfsGatewayClient,
      cid: cidStr,
      destPath: _path,
      expectedSize,
      progress: onProgress,
      log: this.log,
      timeoutMs: timeout
    });
  }

  /**
   * Lists the contents of a directory pointed by the given hash using IPFS DAG-PB.
   * Returns entries with individual file CIDs (required for signature verification).
   *
   * TODO: research why the size is different, i.e for the hash QmWcJrobqhHF7GWpqEbxdv2cWCCXbACmq85Hh7aJ1eu8rn Tsize is 64461521 and size is 64446140
   *
   * @param hash - The content identifier (CID) of the directory.
   * @returns An array of entries in the directory.
   * @throws Error when the provided hash is invalid.
   */
  public async list(hash: string): Promise<IPFSEntry[]> {
    const cidStr = this.sanitizeIpfsPath(hash.toString());
    const cid = CID.parse(cidStr);
    if (cid.code !== dagPb.code || cid.multihash.code !== sha256.code) {
      throw new Error(`Unsupported IPFS directory CID ${cidStr}`);
    }
    return this.ipfsGatewayClient.fetch(
      `/ipfs/${cidStr}?format=raw`,
      { headers: { Accept: "application/vnd.ipld.raw" } },
      async (res) => {
        // Decode locally: newer gateways reject DAG-PB to DAG-JSON conversion.
        const bytes = new Uint8Array(await res.arrayBuffer());
        const actualCid = CID.create(cid.version, dagPb.code, await sha256.digest(bytes));
        if (!actualCid.equals(cid)) throw new Error(`UNTRUSTED CONTENT: expected directory ${cidStr}`);
        const directory = dagPb.decode(bytes);
        return directory.Links.map((link) => ({
          type: "file" as const,
          cid: CID.parse(link.Hash.toString()),
          name: link.Name ?? "",
          path: `${link.Hash}/${link.Name ?? ""}`,
          size: link.Tsize ?? 0
        }));
      },
      { profile: SMALL_REQUEST }
    );
  }

  /**
   * Provider 1: Mirror JSON listing — fast, real filenames, no individual file CIDs.
   * Provider 2: IPFS DAG-PB listing — real individual file CIDs (required for signature verification).
   *
   * Returns a discriminated union so callers never deal with placeholder CIDs.
   * When source is "mirror", signature verification is skipped and signedSafe = true
   * (trust delegated to the mirror operator).
   */
  private async listWithIpfsFallback(hash: string): Promise<ListResult> {
    const packageCidStr = this.sanitizeIpfsPath(hash);

    // Provider 1: Mirror JSON listing — real filenames, no individual file CIDs
    if (this.isMirrorEnabled()) {
      try {
        const files = await this.mirrorProvider.listFiles(packageCidStr);
        let ipfsEntries: Promise<IPFSEntry[]> | undefined;
        const lazyIpfsEntries = (): Promise<IPFSEntry[]> => {
          // Memoise the in-flight lookup, but forget failures so a later call can retry.
          ipfsEntries ??= this.list(hash).catch((e) => {
            ipfsEntries = undefined;
            throw e;
          });
          return ipfsEntries;
        };
        return { source: "mirror", files, packageCidStr, ipfsEntries: lazyIpfsEntries };
      } catch (e) {
        this.log("warn", `Mirror listing of ${packageCidStr} failed, falling back to IPFS: ${errorMessage(e)}`);
      }
    }

    // Provider 2: IPFS DAG-PB — has real individual file CIDs
    const entries = await this.list(hash);
    return { source: "ipfs", entries, packageCidStr };
  }

  /**
   * Downloads a file from IPFS gateways into memory as a CAR, verifying the single root and every
   * block as it streams in. Parsing and verification run inside the gateway retry boundary, so a
   * truncated, incomplete or untrusted response is discarded and the next gateway is tried.
   *
   * @param cidStr - The content identifier (CID) of the file.
   * @param maxLength - Maximum file size in bytes; the CAR response is capped slightly above it.
   * @param gatewayTimeoutMs - Optional cap on each gateway attempt.
   * @throws Error when every gateway failed, e.g. the CAR is incomplete, has the wrong root, or contains an invalid block.
   */
  private async fetchVerifiedFile(cidStr: string, maxLength?: number, gatewayTimeoutMs?: number): Promise<Uint8Array> {
    const root = CID.parse(cidStr);
    const maxCarBytes = maxLength === undefined ? undefined : maxLength + MAX_CAR_OVERHEAD_BYTES;
    return this.ipfsGatewayClient.fetch(
      `/ipfs/${cidStr}?format=car`,
      { headers: { Accept: CAR_ACCEPT } },
      async (res) => {
        const blocks = new Map<string, Uint8Array>();
        for await (const block of verifiedCarBlocks(res, root, maxCarBytes))
          blocks.set(blockKey(block.cid), block.bytes);

        // Incomplete CAR responses can contain the expected root but omit a referenced block.
        // Treat those as a failure of the gateway that supplied the response.
        const content = await exportSingleFile(root, async (cid) => {
          const bytes = blocks.get(blockKey(cid));
          if (!bytes) throw new TransportError("integrity", `Could not get block ${cid}`);
          return bytes;
        });
        const chunks: Uint8Array[] = [];
        let totalLength = 0;
        for await (const chunk of content) {
          totalLength += chunk.length;
          if (maxLength !== undefined && totalLength > maxLength) {
            throw new TransportError("too_large", `Maximum size ${maxLength} bytes exceeded`);
          }
          chunks.push(chunk);
        }
        return concat(chunks, totalLength);
      },
      { profile: SMALL_REQUEST, timeoutMs: gatewayTimeoutMs }
    );
  }

  /**
   * Gets an image by architecture from a ListResult (mirror or IPFS).
   * Throws an error if no image for the given architecture exists.
   *
   * @param manifest - The manifest containing information about the package.
   * @param listResult - The directory listing (mirror or IPFS).
   * @param nodeArch - The architecture of the node.
   * @returns The distributed file object of the image.
   */
  private getImageByArch(manifest: Manifest, listResult: ListResult, nodeArch: NodeJS.Architecture): DistributedFile {
    let arch: Architecture;
    switch (nodeArch) {
      case "arm":
      case "arm64":
        arch = "linux/arm64";
        break;
      case "x64":
        arch = "linux/amd64";
        break;
      default:
        arch = defaultArch;
        break;
    }

    const { name, version } = manifest;
    const missingImageError = (): Error =>
      Error(
        `No image for architecture '${nodeArch}'. ${
          manifest.architectures && manifest.architectures.includes(arch)
            ? `image for ${arch} is missing in release`
            : undefined
        }`
      );

    if (listResult.source === "mirror") {
      const imageFile =
        listResult.files.find((f) => f.name === this.getImageName(name, version, arch)) ||
        (arch === defaultArch
          ? // New DAppNodes should load old single arch packages, and consider their single image as amd64
            listResult.files.find((f) => f.name === this.getLegacyImageName(name, version))
          : undefined);

      if (!imageFile) throw missingImageError();
      return {
        hash: listResult.packageCidStr, // placeholder; actual routing uses packageHash + filename
        size: imageFile.size,
        source: "mirror",
        filename: imageFile.name,
        packageHash: listResult.packageCidStr
      };
    } else {
      const imageEntry =
        listResult.entries.find((e) => e.name === this.getImageName(name, version, arch)) ||
        (arch === defaultArch
          ? // New DAppNodes should load old single arch packages, and consider their single image as amd64
            listResult.entries.find((e) => e.name === this.getLegacyImageName(name, version))
          : undefined);

      if (!imageEntry) throw missingImageError();
      return {
        hash: imageEntry.cid.toString(),
        size: imageEntry.size,
        source
      };
    }
  }

  /**
   * Parses asset data into the specified format (YAML, JSON, or TEXT).
   * Throws an error if an unknown format is specified.
   *
   * @param data - The asset data to parse.
   * @param format - The format to parse the data into.
   * @returns The parsed data.
   */
  private parseAsset<T>(data: string | string[], format: FileFormat): T {
    const parseSingle = (content: string): T => {
      switch (format) {
        case FileFormat.YAML: {
          const parsedYaml = YAML.parse(content);
          if (!parsedYaml || typeof parsedYaml === "string") {
            throw new Error("Invalid YAML object");
          }
          return parsedYaml as T;
        }
        case FileFormat.JSON: {
          return JSON.parse(content) as T;
        }
        case FileFormat.TEXT: {
          return content as T; // TEXT format assumes direct usage of the string.
        }
        default: {
          throw new Error(`Unsupported format: ${format}`);
        }
      }
    };

    const parseContent = (input: string | string[]): T | T[] => {
      if (Array.isArray(input)) {
        return input.map(parseSingle) as T[];
      } else {
        return parseSingle(input);
      }
    };

    try {
      const parsedData = parseContent(data);
      return parsedData as T;
    } catch (e) {
      throw new Error(`Error processing content: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  /**
   * Sanitizes an IPFS path by removing "/ipfs/" if it is present.
   *
   * @param ipfsPath - The IPFS path to sanitize.
   * @returns The sanitized IPFS path.
   */
  protected sanitizeIpfsPath(ipfsPath: string): string {
    if (ipfsPath.includes("ipfs")) return ipfsPath.replace("/ipfs/", "");
    return ipfsPath;
  }

  /**
   * Returns the legacy image path for the given container name and version
   * @param name Container name
   * @param version Container version
   * @returns Legacy image path in the format <name>_<version>.tar.xz
   */
  private getLegacyImageName = (name: string, version: string): string => `${name}_${version}.tar.xz`;

  /**
   * Returns the image path for the given container name, version and architecture
   * @param name Container name
   * @param version Container version
   * @param arch Container architecture in the format <os>/<arch>
   * @returns Image path in the format <name>_<version>_<os>-<arch>.txz
   */
  private getImageName = (name: string, version: string, arch: Architecture): string =>
    `${name}_${version}_${this.getArchTag(arch)}.txz`;

  /**
   * Returns the arch tag for the given architecture
   * @param arch Architecture in the format <os>/<arch>
   * @returns Arch tag in the format <os>-<arch>
   */
  private getArchTag = (arch: Architecture): string => arch.replace(/\//g, "-");
}

/** Finds the individual file CID of `filename` in an IPFS directory listing. */
function findEntryCid(entries: IPFSEntry[], filename: string, packageCidStr: string): string {
  const entry = entries.find((e) => e.name === filename);
  if (!entry) throw Error(`File ${filename} not found in IPFS directory ${packageCidStr}`);
  return entry.cid.toString();
}
