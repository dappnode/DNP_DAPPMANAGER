import fs from "fs";
import path from "path";
import { ipfs, IPFSEntry } from "../src/modules/ipfs";
import { Manifest } from "../src/types";
import { globSource } from "ipfs-http-client";

/**
 * Util, IPFS wrapper with type info
 */

type IpfsAddResult = {
  path: string;
  hash: string;
  size: number;
}[];

/**
 * Wrapper to abstract converting the return values of ipfs.add
 * @param content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ipfsAdd(content: any) {
  const addResult = await ipfs.ipfs.add(content);

  return {
    path: addResult.path,
    hash: addResult.cid.toString(),
    size: addResult.size
  };
}

/**
 * Uploads a directory / file from the local filesystem
 * This should be part of the `DAppNodeSDK`
 */
export async function ipfsAddFromFs(
  path: string,
  options?: { recursive: boolean }
) {
  if (!fs.existsSync(path))
    throw Error(`ipfs.addFromFs error: no file found at: ${path}`);
  return await ipfsAdd(globSource(path, options));
}

export async function ipfsAddDirFromFs(path: string): Promise<string> {
  const addResult = await ipfsAddFromFs(path, { recursive: true });
  return addResult.hash;
}

/**
 * Uploads a manifest from memory
 * This should be part of the `DAppNodeSDK`
 */
export async function ipfsAddManifest(manifest: Manifest): Promise<string> {
  const content = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  const addResult = await ipfsAdd(content);
  return addResult.hash;
}
