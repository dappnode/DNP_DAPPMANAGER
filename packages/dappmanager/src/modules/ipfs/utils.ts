import { IPFSEntry, IPFSPath } from "./types";
import { IpfsFileResult } from "../../types";
import * as db from "../../db";
import params from "../../params";
import { IpfsClientTarget } from "@dappnode/common";

/**
 * ky specific timeout errors https://github.com/sindresorhus/ky/blob/2f37c3f999efb36db9108893b8b3d4b3a7f5ec45/index.js#L127-L132
 */
export function handleIpfsError(e: Error, ipfsPath: IPFSPath): never {
  const hash = ipfsPath.toString();
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

/**
 * Returns the ipfsUrl to initialize the ipfs instance
 */
export function getIpfsUrl(): string {
  // 1. Check for process envs insert in tests
  if (params.IPFS_HOST) return params.IPFS_HOST;
  // 2. Get ipfs client target
  const ipfsClientTarget = db.ipfsClientTarget.get();
  if (!ipfsClientTarget) throw Error("Ipfs client target is not set");
  // 2.1 If LOCAL
  if (ipfsClientTarget === IpfsClientTarget.local) return params.IPFS_LOCAL;
  // 2.2 If REMOTE
  return db.ipfsGateway.get();
}

/** Receives an ipfs path and returns it without the /ipfs/
 * @ipfsPath /ipfs/QmXiTSZNtahKFvwTsBmiXAXmwGhaXtYx1LyyP6QHKfXEWH
 * @returns QmXiTSZNtahKFvwTsBmiXAXmwGhaXtYx1LyyP6QHKfXEWH
 */
export function sanitizeIpfsPath(ipfsPath: string): string {
  if (ipfsPath.includes("ipfs")) return ipfsPath.replace("/ipfs/", "");
  return ipfsPath;
}
