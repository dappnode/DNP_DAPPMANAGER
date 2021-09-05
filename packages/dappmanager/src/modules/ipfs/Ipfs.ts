import { CID, create, IPFSHTTPClient } from "ipfs-http-client";
import { logs } from "../../logs";
import { CatStreamToFsArgs, catStreamToFs } from "./catStreamToFs";
import { IpfsCatOptions, IPFSEntry } from "./types";
import { handleIpfsError } from "./utils";

export class Ipfs {
  ipfs: IPFSHTTPClient;
  /** Default IPFS timeout for all requests */
  timeout = 30 * 1000;

  /**
   * Full URL to an IPFS API
   */
  constructor(ipfsHost: string) {
    this.ipfs = create({
      host: ipfsHost,
      timeout: this.timeout
    });
  }

  /**
   * Returns a file addressed by a valid IPFS Path.
   * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
   * @param options Available options:
   * - maxLength: specifies a length to read from the stream.
   *   if reached, it will throw an error
   * @returns hash contents as a buffer
   */
  async cat(hash: string, opts?: IpfsCatOptions): Promise<Buffer> {
    const chunks = [];
    try {
      for await (const chunk of this.ipfs.cat(hash, {
        length: opts?.maxLength,
        timeout: this.timeout
      })) {
        chunks.push(chunk);
      }
    } catch (e) {
      handleIpfsError(e as Error, hash);
    }

    const data = Buffer.concat(chunks);
    if (opts?.maxLength && data.length >= opts.maxLength)
      throw Error(`Maximum size ${opts.maxLength} bytes exceeded`);

    return data;
  }

  /**
   * Downloads and parses buffer to UTF8
   * @see cat
   */
  async catString(hash: string, opts?: IpfsCatOptions): Promise<string> {
    const buffer = await this.cat(hash, opts);
    return buffer.toString();
  }

  async catStreamToFs(args: CatStreamToFsArgs): Promise<void> {
    return await catStreamToFs(args, this.ipfs);
  }

  async ls(hash: string): Promise<IPFSEntry[]> {
    const files: IPFSEntry[] = [];
    try {
      for await (const file of this.ipfs.ls(hash, { timeout: this.timeout })) {
        files.push(file);
      }
    } catch (e) {
      handleIpfsError(e as Error, hash);
    }

    return files;
  }

  /**
   * Useful to check if a large dataset is available
   * Also possible to get it's size with it by summing its links size
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async objectGet(hash: string) {
    try {
      const cid = CID.parse(hash);
      return await this.ipfs.object.get(cid, { timeout: this.timeout });
    } catch (e) {
      handleIpfsError(e as Error, hash);
    }
  }

  /**
   * Pin a hash
   */
  async pinAdd(hash: string): Promise<void> {
    await this.ipfs.pin.add(hash, { timeout: this.timeout });
  }

  async pinAddNoThrow(hash: string): Promise<void> {
    await this.pinAdd(hash).catch((e: Error) =>
      logs.error(`Error pinning hash ${hash}`, e)
    );
  }
}
