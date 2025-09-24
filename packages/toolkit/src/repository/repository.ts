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

const source = "ipfs" as const;

/**
 * The DappnodeRepository class extends ApmRepository class to provide methods to interact with the IPFS network.
 * To fetch IPFS content it uses dag endpoint for CAR content validation
 *
 * @extends ApmRepository
 */
export class DappnodeRepository extends ApmRepository {
  protected gatewayUrl: string;
  protected localIpfsUrl = "http://ipfs.dappnode:5001";

  /**
   * Constructs an instance of DappnodeRepository
   * @param ipfsUrl - The URL of the IPFS network node.
   * @param ethUrl - The URL of the Ethereum node to connect to.
   */
  constructor(ipfsUrl: string, provider: JsonRpcApiProvider) {
    super(provider);
    this.gatewayUrl = ipfsUrl.replace(/\/?$/, ""); // e.g. "https://gateway.pinata.cloud"
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

    const ipfsEntries = await this.list(contentUri);

    // get manifest
    const manifest = await this.getPkgAsset<Manifest>(releaseFilesToDownload.manifest, ipfsEntries);

    if (!manifest) throw Error(`Invalid pkg release ${contentUri}, manifest not found`);

    return manifest;
  }

  /**
   * Get all the assets for a request
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

    const ipfsEntries = await this.list(contentUri);

    // get manifest
    const manifest = await this.getPkgAsset<Manifest>(releaseFilesToDownload.manifest, ipfsEntries);
    // Ensure its a directory release
    if (!manifest) throw Error(`Invalid pkg release ${contentUri}, manifest not found`);
    const dnpName = manifest.name;
    const isCore = manifest.type === "dncore";

    // get compose
    const compose = await this.getPkgAsset<Compose>(releaseFilesToDownload.compose, ipfsEntries);
    if (!compose) throw Error(`Invalid pkg release ${contentUri}, compose not found`);

    const signature: ReleaseSignature | undefined = await this.getPkgAsset<ReleaseSignature>(
      releaseFilesToDownload.signature,
      ipfsEntries
    );

    const signatureStatus: ReleaseSignatureStatus = signature
      ? getReleaseSignatureStatus(
          manifest.name,
          {
            signature,
            signedData: serializeIpfsDirectory(ipfsEntries, signature.cid)
          },
          trustedKeys
        )
      : { status: ReleaseSignatureStatusCode.notSigned };

    const signedSafe = signatureStatus.status === ReleaseSignatureStatusCode.signedByKnownKey;

    const avatarEntry = ipfsEntries.find((file) => releaseFiles.avatar.regex.test(file.name));
    const avatarFile: DistributedFile | undefined = avatarEntry
      ? {
          hash: avatarEntry.cid.toString(),
          size: avatarEntry.size,
          source,
          imageName: avatarEntry.name
        }
      : undefined;

    return {
      dnpName,
      reqVersion: origin || manifest.version,
      semVersion: manifest.version,
      isCore,
      origin,
      imageFile: this.getImageByArch(manifest, ipfsEntries, os),
      avatarFile,
      manifest,
      setupWizard: await this.getPkgAsset(releaseFilesToDownload.setupWizard, ipfsEntries),
      compose,
      signature,
      signatureStatus,
      // consider adding to signedSafe !origin ||
      signedSafe,
      warnings: {
        coreFromForeignRegistry: isCore && !dnpName.endsWith(dappnodeRegistry),
        requestNameMismatch: isEnsDomain(dnpNameOrHash) && dnpNameOrHash !== dnpName
      },
      disclaimer: await this.getPkgAsset(releaseFilesToDownload.disclaimer, ipfsEntries),
      gettingStarted: await this.getPkgAsset(releaseFilesToDownload.gettingStarted, ipfsEntries),
      prometheusTargets: await this.getPkgAsset(releaseFilesToDownload.prometheusTargets, ipfsEntries),
      grafanaDashboards: await this.getPkgAsset(releaseFilesToDownload.grafanaDashboards, ipfsEntries),
      notifications: await this.getPkgAsset(releaseFilesToDownload.notifications, ipfsEntries)
    };
  }

  /**
   * Get a given release asset for a request. It looks for an IPFS entry for
   * a given release file given a release file config.
   *
   * @param ipfsEntries - An array of IPFS entries.
   * @param fileConfig - A file configuration.
   * @throws - If the file is required and not found.
   * @returns - The release package for the request or undefined if not found.
   */
  public async getPkgAsset<T>(fileConfig: FileConfig, ipfsEntries: IPFSEntry[]): Promise<T | undefined> {
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
      matchingEntries.map((entry) => this.writeFileToMemory(entry.cid.toString(), maxLength))
    );

    // If multiple files are allowed, we return an array of parsed assets.
    // Otherwise, we return a single parsed asset.
    return this.parseAsset<T>(multiple ? contents : contents[0], format);
  }

  /**
   * Downloads the content pointed by the given hash, parses it to UTF8 and returns it as a string.
   * This function is intended for small files.
   *
   * @param hash - The content identifier (CID) of the file to download.
   * @param maxLength - The maximum length of the file in bytes. If the downloaded file exceeds this length, an error is thrown.
   * @returns The downloaded file content as a UTF8 string.
   * @throws Error when the maximum size is exceeded.
   * @see catString
   * @see catCarReaderToMemory
   */
  public async writeFileToMemory(hash: string, maxLength?: number): Promise<string> {
    const chunks: Uint8Array[] = [];
    const { carReader, root } = await this.getAndVerifyContentFromGateway(hash);
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

    // Convert the Uint8Array to a string
    // TODO: This assumes the data is UTF-8 encoded. If it's not, you will need a more complex conversion. Research which encoding is used by IPFS.
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(buffer);
  }

  /**
   * Downloads the content pointed by the given hash and writes it directly to the filesystem.
   * This function is intended for large files, such as Docker images.
   *
   * IMPORTANT: This function is not supported in the browser.
   *
   * @param args - The arguments object.
   * @param args.hash - The content identifier (CID) of the file to download.
   * @param args.path - The path where the file will be written.
   * @param args.timeout - The maximum time to wait for the download in milliseconds.
   * @param args.fileSize - The expected size of the file in bytes.
   * @param args.progress - An optional function to call with the download progress.
   * @returns A promise that resolves when the file has been written.
   * @throws Error when a download timeout occurs or if the provided path is invalid.
   */
  public async writeFileToFs({
    hash,
    path: _path,
    timeout,
    fileSize,
    progress
  }: {
    hash: string;
    path: string;
    timeout?: number;
    fileSize?: number;
    progress?: (n: number) => void;
  }): Promise<void> {
    const { carReader, root } = await this.getAndVerifyContentFromGateway(hash);
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
   * Lists the contents of a directory pointed by the given hash.
   * ipfs.dag.get => reutrns `Tsize`!
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
   * Gets the content from an IPFS gateway using the given hash and verifies its integrity.
   * The content is returned as a CAR reader and the root CID.
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
   * @returns The distributed file object of the image.
   */
  private getImageByArch(manifest: Manifest, files: IPFSEntry[], nodeArch: NodeJS.Architecture): DistributedFile {
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
    const imageName = this.getImageName(name, version, arch);
    const imageAsset =
      files.find((file) => file.name === imageName) ||
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
        imageName,
        hash: imageAsset.cid.toString(),
        size: imageAsset.size,
        source: "github"
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
  private sanitizeIpfsPath(ipfsPath: string): string {
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
