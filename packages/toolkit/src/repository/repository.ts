import * as isIPFS from "is-ipfs";
import { CID, IPFSEntry } from "kubo-rpc-client";
import { CarReader } from "@ipld/car";
import * as dagPb from "@ipld/dag-pb";
import { sha256 } from "multiformats/hashes/sha2";
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
import type { MirrorOptions } from "./contentProvider/index.js";
import { downloadVerifiedFile, verifiedFile } from "./verifiedCar.js";
import { IpfsGatewayClient } from "./ipfsGatewayClient.js";
import type { IpfsGatewayLog } from "./ipfsGatewayClient.js";

const source = "ipfs" as const;
const MAX_CAR_OVERHEAD_BYTES = 1024 * 1024;

/** Authenticated directory entries. Plain HTTP mirror listings are deprecated. */
type ListResult = { source: "ipfs"; entries: IPFSEntry[]; packageCidStr: string };

/** Resolve releases through authenticated DAG-PB listings and verified CAR downloads. */
export class DappnodeRepository extends ApmRepository {
  private readonly ipfsGatewayClient: IpfsGatewayClient;
  protected localIpfsUrl = "http://ipfs.dappnode:5001";

  /**
   * Constructs an instance of DappnodeRepository.
   * @param ipfsUrl - The URL of the IPFS gateway.
   * @param provider - Ethereum JSON-RPC provider for ENS/APM resolution.
   * @param _mirrorOptions - Deprecated; retained for constructor compatibility.
   * @param _isMirrorEnabled - Deprecated; unverified mirrors are never used.
   */
  constructor(
    ipfsUrl: string | string[],
    provider: JsonRpcApiProvider,
    _mirrorOptions: MirrorOptions,
    _isMirrorEnabled: () => boolean,
    ipfsGatewayLog?: IpfsGatewayLog
  ) {
    super(provider);
    this.ipfsGatewayClient = new IpfsGatewayClient(ipfsUrl, ipfsGatewayLog);
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

    const signature = await this.getPkgAsset<ReleaseSignature>(releaseFilesToDownload.signature, listResult);
    const signatureStatus: ReleaseSignatureStatus = signature
      ? getReleaseSignatureStatus(
          manifest.name,
          { signature, signedData: serializeIpfsDirectory(listResult.entries, signature.cid) },
          trustedKeys
        )
      : { status: ReleaseSignatureStatusCode.notSigned };
    const signedSafe = signatureStatus.status === ReleaseSignatureStatusCode.signedByKnownKey;
    const avatarEntry = listResult.entries.find((entry) => releaseFiles.avatar.regex.test(entry.name));
    const avatarFile: DistributedFile | undefined = avatarEntry
      ? { hash: avatarEntry.cid.toString(), size: avatarEntry.size, source }
      : undefined;

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
   * Finds and downloads release assets from an authenticated directory.
   *
   * @param fileConfig - Describes which file(s) to look for and how to parse them.
   * @param listResult - The authenticated directory listing to search in.
   * @throws If a required file is not found.
   */
  public async getPkgAsset<T>(fileConfig: FileConfig, listResult: ListResult): Promise<T | undefined> {
    const { regex, required, multiple, maxSize: maxLength, format } = fileConfig;

    const allFiles = listResult.entries.map((entry) => ({ name: entry.name, fileCid: entry.cid.toString() }));
    const matchingFiles = allFiles.filter((f) => regex.test(f.name));

    if (matchingFiles.length === 0) {
      if (required) throw new Error(`Missing required file: ${regex}`);
      return undefined;
    }

    const contents = await Promise.all(matchingFiles.map((f) => this.downloadReleaseAsset(f.fileCid, maxLength)));

    return this.parseAsset<T>(multiple ? contents : contents[0], format);
  }

  /**
   * Fetches a size-bounded IPFS file by CID into memory as bytes.
   */
  public async writeFileToBytes(hash: string, maxLength?: number, gatewayTimeoutMs?: number): Promise<Uint8Array> {
    const cidStr = this.sanitizeIpfsPath(hash);
    const chunks: Uint8Array[] = [];
    const maxCarBytes = maxLength === undefined ? undefined : maxLength + MAX_CAR_OVERHEAD_BYTES;
    const content = await this.getVerifiedContentFromGateway(cidStr, maxCarBytes, gatewayTimeoutMs);
    let totalLength = 0;
    for await (const chunk of content) {
      totalLength += chunk.length;
      if (maxLength !== undefined && totalLength > maxLength) {
        throw Error(`Maximum size ${maxLength} bytes exceeded`);
      }
      chunks.push(chunk);
    }

    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    chunks.forEach((chunk) => {
      buffer.set(chunk, offset);
      offset += chunk.length;
    });

    return buffer;
  }

  /**
   * Fetches an IPFS file by CID into memory as UTF-8 text. Used ONLY by
   * ipfsTest to verify IPFS connectivity.
   */
  public async writeFileToMemory(hash: string, maxLength?: number): Promise<string> {
    return new TextDecoder("utf-8").decode(await this.writeFileToBytes(hash, maxLength));
  }

  /** Release assets always use the file CID authenticated by the directory block. */
  private async downloadReleaseAsset(fileCid: string, maxLength?: number): Promise<string> {
    return new TextDecoder("utf-8").decode(await this.writeFileToBytes(fileCid, maxLength));
  }

  /** Write a verified file atomically. Legacy mirror routing fields are ignored. */
  public async writeFileToFs({
    hash,
    path: destination,
    timeout,
    fileSize,
    progress
  }: {
    hash: string;
    path: string;
    timeout?: number;
    fileSize?: number;
    progress?: (n: number) => void;
    filename?: string;
    packageHash?: string;
  }): Promise<void> {
    await downloadVerifiedFile(
      this.ipfsGatewayClient,
      CID.parse(this.sanitizeIpfsPath(hash)),
      destination,
      timeout,
      progress,
      fileSize
    );
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
        const bytes = await readResponseBytes(res, 1024 * 1024);
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
      }
    );
  }

  private async listWithIpfsFallback(hash: string): Promise<ListResult> {
    return { source: "ipfs", entries: await this.list(hash), packageCidStr: this.sanitizeIpfsPath(hash) };
  }

  /**
   * Gets the content from an IPFS gateway using the given hash and verifies its integrity.
   *
   * @param hash - The content identifier (CID) of the content to get and verify.
   * @returns The verified UnixFS content.
   * @throws Error when the CAR is incomplete, its root CID differs, or a block fails hash verification.
   */
  private async getVerifiedContentFromGateway(
    hash: string,
    maxResponseBytes?: number,
    gatewayTimeoutMs?: number
  ): Promise<AsyncIterable<Uint8Array>> {
    // 1. Download the CAR
    return this.ipfsGatewayClient.fetch(
      `/ipfs/${hash}?format=car`,
      { headers: { Accept: "application/vnd.ipld.car" } },
      async (res) => {
        // Parse and verify inside the retry boundary. Truncated or untrusted
        // responses are discarded before trying the next gateway.
        const bytes = await readResponseBytes(res, maxResponseBytes);
        const carReader = await CarReader.fromBytes(bytes);
        const content = await verifiedFile(carReader, CID.parse(hash));
        const chunks: Uint8Array[] = [];
        for await (const chunk of content) chunks.push(chunk);
        return chunksToAsyncIterable(chunks);
      },
      { timeoutMs: gatewayTimeoutMs }
    );
  }

  /**
   * Gets an image by architecture from an authenticated directory.
   * Throws an error if no image for the given architecture exists.
   *
   * @param manifest - The manifest containing information about the package.
   * @param listResult - The authenticated directory listing.
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

    const imageEntry =
      listResult.entries.find((entry) => entry.name === this.getImageName(name, version, arch)) ||
      (arch === defaultArch
        ? listResult.entries.find((entry) => entry.name === this.getLegacyImageName(name, version))
        : undefined);
    if (!imageEntry) throw missingImageError();
    return { hash: imageEntry.cid.toString(), size: imageEntry.size, source };
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
    return ipfsPath.replace(/^\/?ipfs\//, "").replace(/\/$/, "");
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

async function readResponseBytes(response: Response, maxBytes?: number): Promise<Uint8Array> {
  const contentLength = response.headers.get("content-length");
  if (maxBytes !== undefined && contentLength !== null && Number(contentLength) > maxBytes) {
    throw Error(`Maximum gateway response size ${maxBytes} bytes exceeded`);
  }

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (maxBytes !== undefined && bytes.length > maxBytes) {
      throw Error(`Maximum gateway response size ${maxBytes} bytes exceeded`);
    }
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalLength += value.length;
    if (maxBytes !== undefined && totalLength > maxBytes) {
      await reader.cancel();
      throw Error(`Maximum gateway response size ${maxBytes} bytes exceeded`);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function* chunksToAsyncIterable(chunks: Uint8Array[]): AsyncIterable<Uint8Array> {
  yield* chunks;
}
