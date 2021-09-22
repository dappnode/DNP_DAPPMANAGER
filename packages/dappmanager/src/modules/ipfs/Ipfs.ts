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
import { handleIpfsError, sanitizeIpfsPath } from "./utils";
import { catCarReaderToMemory, catString } from "./writeFileToMemory";
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
   * Changes the ipfs instance with the given url
   * @param newHost url of the Ipfs node: http://ipfs.dappnode:5001 | http://ipfs.io
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
    if (this.ipfsClientTarget === "local")
      return await catString(this.ipfs, hash, this.timeout, opts);
    else return (await catCarReaderToMemory(this.ipfs, hash, opts)).toString();
  }

  /**
   * Directly write the stream to the fs. Used for big files
   * such as docker images
   * @param args
   */
  async writeFileToFs(args: CatStreamToFsArgs): Promise<void> {
    if (this.ipfsClientTarget === "local")
      return await catStreamToFs(args, this.ipfs);
    else return await writeCarToFs(args, this.ipfs);
  }

  /**
   * List items contained in a CID hash.
   * - LOCAL: ipfs.ls
   * - REMOTE: ipfs.dag.get => created a fake mock that returns same data structure
   * @param hash
   */
  async list(hash: string): Promise<IPFSEntry[]> {
    const files: IPFSEntry[] = [];
    try {
      if (this.ipfsClientTarget === "local") {
        for await (const file of this.ipfs.ls(hash, {
          timeout: this.timeout
        })) {
          files.push(file);
        }
      } else {
        const cid = CID.parse(sanitizeIpfsPath(hash));
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
}
