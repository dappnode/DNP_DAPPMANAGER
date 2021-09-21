import { CID, create, IPFSHTTPClient } from "ipfs-http-client";
import { IPFSEntry } from "ipfs-core-types/src/root";
import * as db from "../../db";
import { logs } from "../../logs";
import {
  CatStreamToFsArgs,
  catStreamToFs,
  writeCarToFs
} from "./writeStreamToFs";
import { IpfsCatOptions, IpfsDagGet } from "./types";
import { handleIpfsError } from "./utils";
import { catCarReaderToMemory } from "./car";
import { IpfsClientTarget } from "../../common";
import path from "path";

export class Ipfs {
  ipfs: IPFSHTTPClient;
  ipfsClientTarget: IpfsClientTarget;
  /** Default IPFS timeout for all requests */
  timeout = 30 * 1000;

  /**
   * Full URL to an IPFS API
   */
  constructor(ipfsHost: string) {
    this.ipfs = create({
      url: ipfsHost,
      timeout: this.timeout
    });
    this.ipfsClientTarget = db.ipfsClientTarget.get();
  }

  /**
   *
   * @param newHost
   */
  changeHost(newHost: string, ipfsClientTarget: IpfsClientTarget): void {
    this.ipfs = create({
      url: newHost,
      timeout: this.timeout
    });
    this.ipfsClientTarget = ipfsClientTarget;
  }

  /**
   * Downloads and parses buffer to UTF8. Used for small files
   * @see catString
   * @see catCarReaderToMemory
   */
  async writeFileToMemory(
    hash: string,
    opts?: IpfsCatOptions
  ): Promise<string> {
    if (this.ipfsClientTarget === "local") {
      return await this.catString(hash, opts);
    } else {
      return await this.catCarReaderToMemory(hash, opts);
    }
  }

  /**
   * Directly write the stream to the fs. Used for big files
   * such as docker images
   * @param args
   */
  async writeFileToFs(args: CatStreamToFsArgs): Promise<void> {
    if (this.ipfsClientTarget === "local") {
      return await catStreamToFs(args, this.ipfs);
    } else {
      return await writeCarToFs(args, this.ipfs);
    }
  }

  async ls(hash: string): Promise<IPFSEntry[]> {
    const files: IPFSEntry[] = [];
    try {
      if (this.ipfsClientTarget === "local") {
        for await (const file of this.ipfs.ls(hash, {
          timeout: this.timeout
        })) {
          files.push(file);
        }
      } else {
        const cid = CID.parse(hash);
        const content = await this.ipfs.dag.get(cid);
        const contentLinks: IpfsDagGet[] = content.value.links;
        if (!contentLinks) throw Error(`hash ${hash} does not contain links`);
        contentLinks.map(link => {
          if (!cid) throw Error("Error getting cid");
          files.push({
            type: "file",
            cid: CID.parse(link.Cid["/"]),
            name: link.Name,
            path: path.join(link.Cid["/"], link.Name),
            size: link.Size
          });
        });
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
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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

  // GATEWAY

  /**
   * Keeps a CarReader in memory
   * @param ipfsPath "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
   * @returns hash contents as a buffer
   */
  private async catCarReaderToMemory(
    ipfsPath: string,
    opts?: IpfsCatOptions
  ): Promise<string> {
    return (await catCarReaderToMemory(this.ipfs, ipfsPath, opts)).toString();
  }

  // API

  /**
   * Parses a file addressed by a valid IPFS Path.
   * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
   * @param options Available options:
   * - maxLength: specifies a length to read from the stream.
   *   if reached, it will throw an error
   * @returns hash contents as a buffer
   * Downloads and parses buffer to UTF8
   * @see cat
   */
  private async catString(
    hash: string,
    opts?: IpfsCatOptions
  ): Promise<string> {
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

    const buffer = Buffer.concat(chunks);
    if (opts?.maxLength && buffer.length >= opts.maxLength)
      throw Error(`Maximum size ${opts.maxLength} bytes exceeded`);

    return buffer.toString();
  }
}
