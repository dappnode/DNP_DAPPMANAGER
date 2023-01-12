import { CID, create, IPFSHTTPClient } from "ipfs-http-client";
import * as db from "../../db";
import { logs } from "../../logs";
import {
  CatStreamToFsArgs,
  catStreamToFs,
  writeCarToFs
} from "./writeStreamToFs";
import { IpfsCatOptions, IPFSEntry, IPFSPath } from "./types";
import { handleIpfsError } from "./utils";
import { catCarReaderToMemory, catString } from "./writeFileToMemory";
import { IpfsClientTarget } from "@dappnode/common";
import { dagGet, ls } from "./list";

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
    if (process.env.TEST) this.ipfsClientTarget = IpfsClientTarget.local;
    else this.ipfsClientTarget = db.ipfsClientTarget.get();
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
    if (this.ipfsClientTarget === IpfsClientTarget.local)
      return await catString(this.ipfs, hash, this.timeout, opts);
    else return (await catCarReaderToMemory(this.ipfs, hash, opts)).toString();
  }

  /**
   * Directly write the stream to the fs. Used for big files
   * such as docker images
   * @param args
   */
  async writeFileToFs(args: CatStreamToFsArgs): Promise<void> {
    if (this.ipfsClientTarget === IpfsClientTarget.local)
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
    try {
      if (this.ipfsClientTarget === IpfsClientTarget.local)
        return await ls(this.ipfs, this.timeout, hash);
      else return await dagGet(this.ipfs, hash);
    } catch (e) {
      handleIpfsError(e as Error, hash);
    }
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
  async pinAdd(hash: IPFSPath): Promise<void> {
    await this.ipfs.pin.add(hash, { timeout: this.timeout });
  }

  async pinAddNoThrow(hash: IPFSPath): Promise<void> {
    // Pin release on visit
    if (db.ipfsClientTarget.get() === "local") {
      await this.pinAdd(hash).catch((e: Error) =>
        logs.error(`Error pinning hash ${hash}`, e)
      );
    } else {
      logs.info("Pinning hash not supported when using remote ipfs client");
    }
  }
}
