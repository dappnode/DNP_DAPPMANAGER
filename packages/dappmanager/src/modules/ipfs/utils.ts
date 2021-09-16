import { IPFSEntry } from ".";
import { IpfsFileResult } from "../../types";
import * as db from "../../db";
import params from "../../params";

/**
 * ky specific timeout errors https://github.com/sindresorhus/ky/blob/2f37c3f999efb36db9108893b8b3d4b3a7f5ec45/index.js#L127-L132
 */
export function handleIpfsError(e: Error, hash: string): never {
  if (e.name === "TimeoutError" || e.message.includes("timed out")) {
    throw Error(`IPFS hash not available ${hash}`);
  } else {
    throw Error(`IPFS hash not available ${hash}: ${e.message}`);
  }
}

export function fromIpfsEntries(ipfsEntries: IPFSEntry[]): IpfsFileResult[] {
  return ipfsEntries.map(entry => ({
    ...entry,
    hash: entry.cid.toString()
  }));
}

export function getIpfsUrl(): string {
  if (params.IPFS_HOST) return params.IPFS_HOST;
  const ipfsClientTarget = db.ipfsClientTarget.get();
  if (!ipfsClientTarget) throw Error("Ipfs client target is not set");
  return ipfsClientTarget === "local" ? params.IPFS_LOCAL : params.IPFS_REMOTE;
}
