import * as isIPFS from "is-ipfs";
import { CID, IPFSEntry } from "kubo-rpc-client";
import { CarReader } from "@ipld/car";
import { recursive as exporter } from "ipfs-unixfs-exporter";
import { Version } from "multiformats";
import path from "path";
import fs from "fs";
import stream from "stream";
import util from "util";
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
import { logs } from "@dappnode/logger";
import { MirrorProvider, HttpMirrorProvider } from "./contentProvider/index.js";

const source = "ipfs" as const;

export interface DappnodeRepositoryOptions {
  mirror?: {
    baseUrl: string;
    timeoutMs: number;
    maxBytes: number;
  };
}

/**
 * The DappnodeRepository class extends ApmRepository class to provide methods to interact with the IPFS network.
 * To fetch IPFS content it uses dag endpoint for CAR content validation.
 *
 * When a mirror provider is configured, file downloads and directory listings fall back to the mirror
 * if IPFS is unreachable. The mirror does not provide individual file CIDs, so when the mirror is used
 * for directory listing, signature verification is skipped and packages are treated as trusted
 * (signedSafe = true, signatureStatus = notSigned).
 *
 * Provider priority (easy to swap — search for "Provider 1" and "Provider 2"):
 *   1. Mirror HTTP (if configured)
 *   2. IPFS fallback (dag-json listing + CAR downloads)
 *
 * @extends ApmRepository
 */
export class DappnodeRepository extends ApmRepository {
  protected gatewayUrl: string;
  protected localIpfsUrl = "http://ipfs.dappnode:5001";
  protected mirrorProvider?: MirrorProvider;

  /**
   * Constructs an instance of DappnodeRepository.
   * @param ipfsUrl - The URL of the IPFS gateway.
   * @param provider - Ethereum JSON-RPC provider for ENS/APM resolution.
   * @param options - Optional configuration including mirror provider.
   */
  constructor(ipfsUrl: string, provider: JsonRpcApiProvider, options?: DappnodeRepositoryOptions) {
    super(provider);
    this.gatewayUrl = ipfsUrl.replace(/\/?$/, "");

    if (options?.mirror) {
      this.mirrorProvider = new HttpMirrorProvider(
        options.mirror.baseUrl,
        options.mirror.timeoutMs,
        options.mirror.maxBytes
      );
    }
  }

  /**
   * Changes the IPFS provider and target.
   * @param ipfsUrl - The new URL of the IPFS network node.
   */
  public changeIpfsGatewayUrl(ipfsUrl: string): void {
    this.gatewayUrl = ipfsUrl.replace(/\/?$/, "");
  }

  /**
   * Pin content to local IPFS node
   */
  public async pinAddLocal(hash: string): Promise<void> {
    await fetch(`${this.localIpfsUrl}/api/v0/pin/add?arg=${hash}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  /**
   * Unpin content from local IPFS node
   */
  public async pinRmLocal(hash: string): Promise<void> {
    await fetch(`${this.localIpfsUrl}/api/v0/pin/rm?arg=${hash}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
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

    const { entries: ipfsEntries, packageCidStr } = await this.listWithIpfsFallback(contentUri);

    // pass packageCidStr so mirror is tried first for the download
    const manifest = await this.getPkgAsset<Manifest>(releaseFilesToDownload.manifest, ipfsEntries, packageCidStr);

    if (!manifest) throw Error(`Invalid pkg release ${contentUri}, manifest not found`);

    return manifest;
  }

  // Q: does getPkgRelease actually download a package?
  // A: getPkgRelease downloads the manifest, compose and other metadata files, but it does not download the image file.
  //  The image file is downloaded later when the package is being installed, using the information about the image file obtained
  //  in getPkgRelease. This allows us to fetch the package information and display it to the user without having to
  //  download the potentially large image file until it's actually needed for installation.
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

    const { entries: ipfsEntries, hasRealCids, packageCidStr } = await this.listWithIpfsFallback(contentUri);

    // get manifest
    const manifest = await this.getPkgAsset<Manifest>(releaseFilesToDownload.manifest, ipfsEntries, packageCidStr);
    // Ensure its a directory release
    if (!manifest) throw Error(`Invalid pkg release ${contentUri}, manifest not found`);
    const dnpName = manifest.name;
    const isCore = manifest.type === "dncore";

    // get compose
    const compose = await this.getPkgAsset<Compose>(releaseFilesToDownload.compose, ipfsEntries, packageCidStr);
    if (!compose) throw Error(`Invalid pkg release ${contentUri}, compose not found`);

    // Signature verification requires individual file CIDs from IPFS dag-json listing.
    // When using mirror fallback listing, CIDs are placeholders so verification is skipped.
    // Packages sourced from the mirror are trusted by the mirror operator (signedSafe = true).
    const signature: ReleaseSignature | undefined = hasRealCids
      ? await this.getPkgAsset<ReleaseSignature>(releaseFilesToDownload.signature, ipfsEntries, packageCidStr)
      : undefined;

    const signatureStatus: ReleaseSignatureStatus =
      hasRealCids && signature
        ? getReleaseSignatureStatus(
            manifest.name,
            {
              signature,
              signedData: serializeIpfsDirectory(ipfsEntries, signature.cid)
            },
            trustedKeys
          )
        : { status: ReleaseSignatureStatusCode.notSigned };

    // When IPFS listing is available, signedSafe requires a known trusted key.
    // When mirror listing is used (no real CIDs), trust the mirror operator.
    const signedSafe = hasRealCids
      ? signatureStatus.status === ReleaseSignatureStatusCode.signedByKnownKey
      : true;

    // Avatar file hash is an individual file CID — only meaningful when listing came from IPFS.
    // When using mirror listing, set avatarUrl directly in the manifest so it's available to the UI.
    const avatarEntry = hasRealCids ? ipfsEntries.find((file: IPFSEntry) => releaseFiles.avatar.regex.test(file.name)) : undefined;
    const avatarFile: DistributedFile | undefined = avatarEntry
      ? { hash: avatarEntry.cid.toString(), size: avatarEntry.size, source }
      : undefined;

    if (!hasRealCids && this.mirrorProvider) {
      manifest.avatarUrl = this.mirrorProvider.getFileUrl(packageCidStr, "avatar.png");
    }

    return {
      dnpName,
      reqVersion: origin || manifest.version,
      semVersion: manifest.version,
      isCore,
      origin,
      imageFile: this.getImageByArch(manifest, ipfsEntries, os, packageCidStr),
      avatarFile,
      manifest,
      setupWizard: await this.getPkgAsset(releaseFilesToDownload.setupWizard, ipfsEntries, packageCidStr),
      compose,
      signature,
      signatureStatus,
      signedSafe,
      warnings: {
        coreFromForeignRegistry: isCore && !dnpName.endsWith(dappnodeRegistry),
        requestNameMismatch: isEnsDomain(dnpNameOrHash) && dnpNameOrHash !== dnpName
      },
      disclaimer: await this.getPkgAsset(releaseFilesToDownload.disclaimer, ipfsEntries, packageCidStr),
      gettingStarted: await this.getPkgAsset(releaseFilesToDownload.gettingStarted, ipfsEntries, packageCidStr),
      prometheusTargets: await this.getPkgAsset(releaseFilesToDownload.prometheusTargets, ipfsEntries, packageCidStr),
      grafanaDashboards: await this.getPkgAsset(releaseFilesToDownload.grafanaDashboards, ipfsEntries, packageCidStr),
      notifications: await this.getPkgAsset(releaseFilesToDownload.notifications, ipfsEntries, packageCidStr)
    };
  }

  /**
   * Get a given release asset for a request. It looks for an IPFS entry for
   * a given release file given a release file config.
   *
   * @param fileConfig - A file configuration.
   * @param ipfsEntries - An array of IPFS entries.
   * @param packageHash - Optional package directory CID for mirror downloads.
   * @throws - If the file is required and not found.
   * @returns - The release package for the request or undefined if not found.
   */
  public async getPkgAsset<T>(fileConfig: FileConfig, ipfsEntries: IPFSEntry[], packageHash?: string): Promise<T | undefined> {
    const { regex, required, multiple } = fileConfig;
    // We filter the entries (files) so that we only consider the ones that match the regex.
    // for example, all grafana dashboards must pass /.*grafana-dashboard.json$/ regex
    const matchingEntries = ipfsEntries.filter((file) => regex.test(file.name));

    // Handle no matches. If the file is required, throw an error, otherwise return undefined.
    if (matchingEntries.length === 0) {
      if (required) throw new Error(`Missing required file: ${regex}`);
      return undefined;
    }

    // Process matched entries. If multiple files are allowed, and more than one file matches, we parse all of them.
    const { maxSize: maxLength, format } = fileConfig;
    const contents = await Promise.all(
      matchingEntries.map((entry) => this.writeFileToMemory(entry.cid.toString(), maxLength, entry.name, packageHash))
    );

    // If multiple files are allowed, we return an array of parsed assets.
    // Otherwise, we return a single parsed asset.
    return this.parseAsset<T>(multiple ? contents : contents[0], format);
  }

  /**
   * Downloads the content pointed by the given hash, parses it to UTF8 and returns it as a string.
   * This function is intended for small files.
   *
   * Provider priority:
   *   1. Mirror — if configured and filename + packageHash are provided
   *   2. IPFS CAR — via the configured gateway
   *
   * @param hash - The individual file CID (used for IPFS fallback).
   * @param maxLength - The maximum length of the file in bytes.
   * @param filename - Filename within the package (used for mirror URL construction).
   * @param packageHash - Package directory CID (used for mirror URL: /{packageHash}/{filename}).
   * @returns The downloaded file content as a UTF8 string.
   * @throws Error when the maximum size is exceeded.
   */
  public async writeFileToMemory(hash: string, maxLength?: number, filename?: string, packageHash?: string): Promise<string> {
    const cidStr = this.sanitizeIpfsPath(hash.toString());

    // Provider 1: Mirror — try first if configured and we have routing info
    if (this.mirrorProvider && filename && packageHash) {
      const mirrorCid = this.sanitizeIpfsPath(packageHash);
      const result = await this.mirrorProvider.fetchFile(mirrorCid, filename, {});
      if (result.status === "success") {
        if (maxLength && result.bytes.length >= maxLength) {
          throw Error(`Maximum size ${maxLength} bytes exceeded`);
        }
        return new TextDecoder("utf-8").decode(result.bytes);
      }
      logs.warn(`Mirror fetch failed for ${filename} (${result.reason}), falling back to IPFS`);
    }

    // Provider 2: IPFS CAR — fallback (or primary when mirror is not configured)
    const chunks: Uint8Array[] = [];
    const { carReader, root } = await this.getAndVerifyContentFromGateway(cidStr);
    const content = await this.unpackCarReader(carReader, root);
    for await (const chunk of content) chunks.push(chunk);

    // Concatenate the chunks into a single Uint8Array
    let totalLength = 0;
    chunks.forEach((chunk) => (totalLength += chunk.length));
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    chunks.forEach((chunk) => {
      buffer.set(chunk, offset);
      offset += chunk.length;
    });

    if (maxLength && buffer.length >= maxLength) throw Error(`Maximum size ${maxLength} bytes exceeded`);

    // TODO: This assumes the data is UTF-8 encoded. If it's not, you will need a more complex conversion. Research which encoding is used by IPFS.
    return new TextDecoder("utf-8").decode(buffer);
  }

  /**
   * Downloads the content pointed by the given hash and writes it directly to the filesystem.
   * This function is intended for large files, such as Docker images.
   *
   * Provider priority:
   *   1. Mirror — streams directly to disk (no RAM buffering) if configured and filename + packageHash are provided
   *   2. IPFS CAR — via the configured gateway
   *
   * IMPORTANT: This function is not supported in the browser.
   *
   * @param args.hash - Individual file CID (used for IPFS fallback).
   * @param args.path - The path where the file will be written.
   * @param args.timeout - Maximum time to wait for the IPFS download in milliseconds.
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
    const cidStr = this.sanitizeIpfsPath(hash.toString());

    // Provider 1: Mirror — stream directly to disk to avoid OOM on large Docker images
    if (this.mirrorProvider && filename && packageHash) {
      const mirrorCid = this.sanitizeIpfsPath(packageHash);
      const result = await this.mirrorProvider.fetchFileToPath(mirrorCid, filename, _path, {
        onProgress: progress
      });
      if (result.status === "success") return;
      logs.warn(`Mirror stream failed for ${filename} (${result.reason}), falling back to IPFS`);
    }

    // Provider 2: IPFS CAR — fallback (or primary when mirror is not configured)
    const { carReader, root } = await this.getAndVerifyContentFromGateway(cidStr);
    const readable = await this.unpackCarReader(carReader, root);

    return new Promise((resolve, reject) => {
      async function handleDownload(): Promise<void> {
        if (!_path || _path.startsWith("/ipfs/") || !path.isAbsolute("/")) reject(Error(`Invalid path: "${path}"`));

        const asyncIterableArray: Uint8Array[] = [];

        // Timeout cancel mechanism
        const timeoutToCancel = setTimeout(
          () => {
            reject(Error(`Timeout downloading ${hash}`));
          },
          timeout || 30 * 1000
        );

        let totalData = 0;
        let previousProgress = -1;
        const resolution = 1;
        const round = (n: number): number => resolution * Math.round((100 * n) / resolution);

        const onData = (chunk: Uint8Array): void => {
          clearTimeout(timeoutToCancel);
          totalData += chunk.length;
          asyncIterableArray.push(chunk);
          if (progress && fileSize) {
            const currentProgress = round(totalData / fileSize);
            if (currentProgress !== previousProgress) {
              progress(currentProgress);
              previousProgress = currentProgress;
            }
          }
        };

        const onFinish = (): void => {
          clearTimeout(timeoutToCancel);
          resolve();
        };

        const onError =
          (streamId: string) =>
          (err: Error): void => {
            clearTimeout(timeoutToCancel);
            reject(Error(streamId + ": " + err));
          };

        try {
          for await (const chunk of readable) onData(chunk);

          const writable = fs.createWriteStream(_path);
          await util.promisify(stream.pipeline)(stream.Readable.from(asyncIterableArray), writable);
          onFinish();
        } catch (e) {
          onError("Error writing to fs")(e as Error);
        }
      }

      handleDownload().catch((error) => reject(error));
    });
  }

  /**
   * Lists the contents of a directory pointed by the given hash using IPFS dag-json.
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
    const url = `${this.gatewayUrl}/ipfs/${cidStr}?format=dag-json`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.ipld.dag-json" }
    });
    if (!res.ok) {
      throw new Error(`Failed to list directory ${cidStr}: ${res.status} ${res.statusText}`);
    }

    const dagJson = (await res.json()) as {
      Links?: Array<{
        Name: string;
        Hash: { "/": string };
        Tsize: number;
      }>;
    };

    if (!dagJson.Links) {
      throw new Error(`Invalid IPFS directory CID ${cidStr}`);
    }

    return dagJson.Links.map((link) => ({
      type: "file",
      cid: CID.parse(this.sanitizeIpfsPath(link.Hash["/"])),
      name: link.Name,
      path: `${link.Hash["/"]}/${link.Name}`,
      size: link.Tsize
    }));
  }

  /**
   * Provider 1: Mirror JSON listing — fast, no individual file CIDs.
   * Provider 2: IPFS dag-json listing — real individual file CIDs (signature verification possible).
   *
   * When hasRealCids is false, signature verification must be skipped and the caller
   * should treat the package as trusted by the mirror operator (signedSafe = true).
   */
  private async listWithIpfsFallback(hash: string): Promise<{
    entries: IPFSEntry[];
    hasRealCids: boolean;
    packageCidStr: string;
  }> {
    const packageCidStr = this.sanitizeIpfsPath(hash);

    // Provider 1: Mirror JSON listing — no individual CIDs; use package CID as placeholder
    if (this.mirrorProvider) {
      try {
        const mirrorFiles = await this.mirrorProvider.listFiles(packageCidStr);
        const placeholderCid = CID.parse(packageCidStr);
        const entries: IPFSEntry[] = mirrorFiles.map((f) => ({
          type: "file" as const,
          cid: placeholderCid,
          name: f.name,
          path: `${packageCidStr}/${f.name}`,
          size: f.size
        }));
        return { entries, hasRealCids: false, packageCidStr };
      } catch (mirrorErr) {
        logs.warn(`Mirror listing failed for ${packageCidStr}, falling back to IPFS: ${mirrorErr}`);
      }
    }

    // Provider 2: IPFS dag-json — has real individual file CIDs
    const entries = await this.list(hash);
    return { entries, hasRealCids: true, packageCidStr };
  }

  /**
   * Gets the content from an IPFS gateway using the given hash and verifies its integrity.
   *
   * @param hash - The content identifier (CID) of the content to get and verify.
   * @returns The content as a CAR reader and the root CID.
   * @throws Error when the root CID does not match the provided hash (content is untrusted).
   */
  private async getAndVerifyContentFromGateway(hash: string): Promise<{
    carReader: CarReader;
    root: CID;
  }> {
    // 1. Download the CAR
    const url = `${this.gatewayUrl}/ipfs/${hash}?format=car`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.ipld.car" }
    });
    if (!res.ok) throw new Error(`Gateway error: ${res.status} ${res.statusText}`);

    // 2. Parse into a CarReader
    const bytes = new Uint8Array(await res.arrayBuffer());
    const carReader = await CarReader.fromBytes(bytes);

    // 3. Verify the root CID
    const roots = await carReader.getRoots();
    const root = roots[0];
    if (roots.length !== 1 || root.toString() !== CID.parse(hash).toString()) {
      throw new Error(`UNTRUSTED CONTENT: expected root ${hash}, got ${roots}`);
    }

    return { carReader, root };
  }

  /**
   * Unpacks a CAR reader and returns an async iterable of uint8arrays.
   *
   * @param carReader - The CAR reader to unpack.
   * @param root - The root CID.
   * @returns An async iterable of uint8arrays.
   */
  private async unpackCarReader(
    carReader: CarReader,
    root: CID<unknown, number, number, Version>
  ): Promise<AsyncIterable<Uint8Array>> {
    const iterable: AsyncIterable<Uint8Array>[] = [];

    const entries = exporter(root, {
      async get(cid) {
        // TODO: remove below type casting
        const block = await carReader.get(cid as CID);
        if (!block) throw Error(`Could not get block ${cid}`);
        return block.bytes;
      }
    });

    for await (const entry of entries) {
      if (entry.type === "file") iterable.push(entry.content());
      else throw Error(`Expected type: file, got: ${entry.type}`);
    }
    if (iterable.length > 1) throw Error(`Unexpected number of files. There must be only one`);

    return iterable[0];
  }

  /**
   * Gets an image by architecture from a set of IPFS entries.
   * Throws an error if no image for the given architecture exists.
   *
   * @param manifest - The manifest containing information about the package.
   * @param files - An array of IPFS entries.
   * @param nodeArch - The architecture of the node.
   * @param packageHash - Optional package directory CID for mirror URL construction.
   * @returns The distributed file object of the image.
   */
  private getImageByArch(manifest: Manifest, files: IPFSEntry[], nodeArch: NodeJS.Architecture, packageHash?: string): DistributedFile {
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
    const imageAsset =
      files.find((file) => file.name === this.getImageName(name, version, arch)) ||
      (arch === defaultArch
        ? // New DAppNodes should load old single arch packages,
          // and consider their single image as amd64
          files.find((file) => file.name === this.getLegacyImageName(name, version))
        : undefined);

    if (!imageAsset) {
      throw Error(
        `No image for architecture '${nodeArch}'. ${
          manifest.architectures && manifest.architectures.includes(arch)
            ? `image for ${arch} is missing in release`
            : undefined
        }`
      );
    } else {
      return {
        hash: imageAsset.cid.toString(),
        size: imageAsset.size,
        source,
        filename: imageAsset.name,
        packageHash
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
