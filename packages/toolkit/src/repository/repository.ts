import * as isIPFS from "is-ipfs";
import {
  PkgRelease,
  FileConfig,
  FileFormat,
  DistributedFile,
  IPFSEntry,
} from "./types.js";
import { CID, IPFSHTTPClient, create } from "kubo-rpc-client";
import { CarReader } from "@ipld/car";
import { recursive as exporter } from "ipfs-unixfs-exporter";
import { Version } from "multiformats";
import path from "path";
import fs from "fs";
import stream from "stream";
import util from "util";
import {
  Architecture,
  Manifest,
  defaultArch,
  releaseFiles,
  releaseFilesToDownload,
} from "@dappnode/common";
import { getImageName, getLegacyImageName } from "@dappnode/utils";
import YAML from "yaml";
import { ApmRepository } from "./apmRepository.js";
import { IPFSPath } from "kubo-rpc-client/dist/src/types.js";

const source = "ipfs" as const;

/**
 * The DappnodeRepository class extends ApmRepository class to provide methods to interact with the IPFS network.
 * To fetch IPFS content it uses dag endpoint for CAR content validation
 *
 * @extends ApmRepository
 */
export class DappnodeRepository extends ApmRepository {
  protected ipfs: IPFSHTTPClient;
  protected timeout: number;

  /**
   * Constructs an instance of DappnodeRepository
   * @param ipfsUrl - The URL of the IPFS network node.
   * @param ethUrl - The URL of the Ethereum node to connect to.
   */
  constructor(ipfsUrl: string, ethUrl: string, timeout?: number) {
    super(ethUrl);
    this.timeout = timeout || 30 * 1000;
    this.ipfs = create({ url: ipfsUrl, timeout: this.timeout });
  }

  /**
   * Changes the IPFS provider and target.
   * @param ipfsUrl - The new URL of the IPFS network node.
   */
  public changeIpfsProvider(ipfsUrl: string): void {
    this.ipfs = create({ url: ipfsUrl, timeout: 30 * 1000 });
  }

  /**
   * Pins a hash to the IPFS node. Do not throw errors.
   * @param hash
   */
  private async pinAddNoThrow(hash: IPFSPath): Promise<void> {
    try {
      await this.ipfs.pin.add(hash);
    } catch (e) {
      console.error(`Error pinning ${hash}`, e);
    }
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
    os?: NodeJS.Architecture
  ): Promise<PkgRelease[]> {
    return await Promise.all(
      Object.entries(packages).map(
        async ([name, version]) =>
          await this.getPkgRelease({
            dnpName: name,
            os,
            version,
          })
      )
    );
  }

  /**
   * Get all the assets for a request
   * @param param0 - Object containing package name, version and architecture
   * @returns - The release package for the request
   */
  public async getPkgRelease({
    dnpName,
    os = "x64",
    version,
  }: {
    dnpName: string;
    os?: NodeJS.Architecture;
    version?: string;
  }): Promise<PkgRelease> {
    const { contentUri } = await this.getVersionAndIpfsHash({
      dnpName,
      version,
    });
    // pin hash
    await this.pinAddNoThrow(this.sanitizeIpfsPath(contentUri));
    if (!isIPFS.cid(this.sanitizeIpfsPath(contentUri)))
      throw Error(`Invalid IPFS hash ${contentUri}`);

    const ipfsEntries = await this.list(contentUri);
    // Get manifest
    if (!this.isDirectoryRelease(ipfsEntries))
      throw Error(`Invalid pkg release ${contentUri}, manifest not found`);

    const manifest = await this.getPkgAsset<Manifest>(
      releaseFilesToDownload.manifest,
      this.getAssetIpfsEntry(
        ipfsEntries,
        releaseFilesToDownload.manifest
      )?.cid.toString() || ""
    );
    const avatar = this.getAssetIpfsEntry(ipfsEntries, releaseFiles.avatar);
    return {
      imageFile: this.getImageByArch(manifest, ipfsEntries, os),
      avatarFile: avatar
        ? { hash: avatar.cid.toString(), size: avatar.size, source }
        : undefined,
      manifest,
      compose: await this.getPkgAsset(
        releaseFilesToDownload.compose,
        this.getAssetIpfsEntry(
          ipfsEntries,
          releaseFilesToDownload.compose
        )?.cid.toString() || ""
      ),
      signature: ipfsEntries.find((ipfsEntry) =>
        releaseFilesToDownload.signature.regex.test(ipfsEntry.name)
      )
        ? await this.getPkgAsset(
            releaseFilesToDownload.signature,
            this.getAssetIpfsEntry(
              ipfsEntries,
              releaseFilesToDownload.signature
            )?.cid.toString() || ""
          )
        : undefined,
      disclaimer: await this.getPkgAsset(
        releaseFilesToDownload.disclaimer,
        this.getAssetIpfsEntry(
          ipfsEntries,
          releaseFilesToDownload.disclaimer
        )?.cid.toString() || ""
      ),
      gettingStarted: await this.getPkgAsset(
        releaseFilesToDownload.gettingStarted,
        this.getAssetIpfsEntry(
          ipfsEntries,
          releaseFilesToDownload.gettingStarted
        )?.cid.toString() || ""
      ),
      prometheusTargets: await this.getPkgAsset(
        releaseFilesToDownload.prometheusTargets,
        this.getAssetIpfsEntry(
          ipfsEntries,
          releaseFilesToDownload.prometheusTargets
        )?.cid.toString() || ""
      ),
      grafanaDashboards: await this.getPkgAsset(
        releaseFilesToDownload.grafanaDashboards,
        this.getAssetIpfsEntry(
          ipfsEntries,
          releaseFilesToDownload.grafanaDashboards
        )?.cid.toString() || ""
      ),
    };
  }

  /**
   * Get a given release asset for a request
   * @param config - File configuration object
   * @param hash - The IPFS hash of the asset
   * @returns - The release package for the request
   */
  public async getPkgAsset<T>(config: FileConfig, hash: string): Promise<T> {
    if (!hash && config.required)
      throw Error(`Asset required but hash missing`);
    const { maxSize: maxLength, format } = config;
    const content = await this.writeFileToMemory(hash, maxLength);
    // TODO: validate content with JSON schema
    return this.parseAsset<T>(content, format);
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
  private async writeFileToMemory(
    hash: string,
    maxLength?: number
  ): Promise<string> {
    const chunks = [];
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

    if (maxLength && buffer.length >= maxLength)
      throw Error(`Maximum size ${maxLength} bytes exceeded`);

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
    progress,
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
        if (!_path || _path.startsWith("/ipfs/") || !path.isAbsolute("/"))
          reject(Error(`Invalid path: "${path}"`));

        const asyncIterableArray: Uint8Array[] = [];

        // Timeout cancel mechanism
        const timeoutToCancel = setTimeout(() => {
          reject(Error(`Timeout downloading ${hash}`));
        }, timeout || 30 * 1000);

        let totalData = 0;
        let previousProgress = -1;
        const resolution = 1;
        const round = (n: number): number =>
          resolution * Math.round((100 * n) / resolution);

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
          await util.promisify(stream.pipeline)(
            stream.Readable.from(asyncIterableArray),
            writable
          );
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
    const files: IPFSEntry[] = [];
    const dagGet = await this.ipfs.dag.get(
      CID.parse(this.sanitizeIpfsPath(hash)),
      { timeout: this.timeout }
    );
    if (dagGet.value.Links)
      for (const link of dagGet.value.Links)
        files.push({
          type: "file",
          cid: CID.parse(this.sanitizeIpfsPath(link.Hash.toString())),
          name: link.Name,
          path: `${link.Hash.toString()}/${link.Name}`, // Do not use module path to be browser compatible. path.join(link.Hash.toString(), link.Name),
          size: link.Tsize,
        });
    else throw Error(`Invalid IPFS hash ${hash}`);

    return files;
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
    root: CID<unknown, number, number, Version>;
  }> {
    const cid = CID.parse(this.sanitizeIpfsPath(hash));
    const asynciterable = this.ipfs.dag.export(cid, { timeout: this.timeout });
    const carReader = await CarReader.fromIterable(asynciterable);
    const roots = await carReader.getRoots();
    const root = roots[0];
    if (cid.toString() !== root.toString())
      throw Error(`UNTRUSTED CONTENT: Invalid root CID ${root} for ${cid}`);

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
        const block = await carReader.get(cid);
        if (!block) throw Error(`Could not get block ${cid}`);
        return block.bytes;
      },
    });

    for await (const entry of entries) {
      if (entry.type === "file") iterable.push(entry.content());
      else throw Error(`Expexted type: file, got: ${entry.type}`);
    }
    if (iterable.length > 1)
      throw Error(`Unexpected number of files. There must be only one`);

    return iterable[0];
  }

  /**
   * Checks if the IPFS path is a root directory
   * by detecting the manifest in the files.
   *
   * @param ipfsEntries - IPFS files.
   * @returns True if it is a root directory, false otherwise.
   */
  private async isDirectoryRelease(ipfsEntries: IPFSEntry[]): Promise<boolean> {
    return ipfsEntries.some((file) =>
      releaseFiles.manifest.regex.test(file.name)
    );
  }

  /**
   * Gets an IPFS entry for a given release file given a release file config.
   * Throws an error if the IPFS entry is required but not found.
   * Returns undefined if the IPFS entry is not required and not found.
   *
   * @param ipfsEntries - An array of IPFS entries.
   * @param fileConfig - A file configuration.
   * @returns The matching IPFS entry, or undefined if not found and not required.
   */
  private getAssetIpfsEntry(
    ipfsEntries: IPFSEntry[],
    fileConfig: Omit<FileConfig, "format">
  ): IPFSEntry | undefined {
    const { regex, required } = fileConfig;
    const entry = ipfsEntries.find((file) => regex.test(file.name));
    if (!entry && required) throw Error(`Missing required file ${regex}`);
    return entry;
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
  private getImageByArch(
    manifest: Manifest,
    files: IPFSEntry[],
    nodeArch: NodeJS.Architecture
  ): DistributedFile {
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
      files.find((file) => file.name === getImageName(name, version, arch)) ||
      (arch === defaultArch
        ? // New DAppNodes should load old single arch packages,
          // and consider their single image as amd64
          files.find((file) => file.name === getLegacyImageName(name, version))
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
        source, // TODO: consdier adding different sources
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
  private parseAsset<T>(data: string, format: FileFormat): T {
    switch (format) {
      case FileFormat.YAML:
        try {
          const parsedData = YAML.parse(data);
          if (!parsedData || typeof parsedData === "string")
            throw Error(`returned invalid object`);
          return parsedData as T;
        } catch (e) {
          if (e instanceof Error)
            e.message = `Error parsing YAML: ${e.message}`;
          throw e;
        }
      case FileFormat.JSON:
        try {
          return JSON.parse(data);
        } catch (e) {
          if (e instanceof Error)
            e.message = `Error parsing JSON: ${e.message}`;
          throw e;
        }
      case FileFormat.TEXT:
        return data as T;
      default:
        throw Error(`Attempting to parse unknown format ${format}`);
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
}
