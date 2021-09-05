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
async function ipfsAdd(content: any): Promise<IpfsAddResult> {
  const files = ((await ipfs.ipfs.add(content)) as unknown) as IPFSEntry[];

  return files.map(file => ({
    path: file.path,
    hash: file.cid.toString(),
    size: file.size
  }));
}

/**
 * Uploads a directory / file from the local filesystem
 * This should be part of the `DAppNodeSDK`
 */
export async function ipfsAddFromFs(
  path: string,
  options?: { recursive: boolean }
): Promise<IpfsAddResult> {
  if (!fs.existsSync(path))
    throw Error(`ipfs.addFromFs error: no file found at: ${path}`);
  return await ipfsAdd(globSource(path, options));
}

export async function ipfsAddDirFromFs(path: string): Promise<string> {
  return ipfsAddFromFs(path, { recursive: true }).then(findRootHash);
}

/**
 * Uploads a manifest from memory
 * This should be part of the `DAppNodeSDK`
 */
export async function ipfsAddManifest(manifest: Manifest): Promise<string> {
  const content = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  const results = await ipfsAdd(content);
  return results[0].hash;
}

/**
 * Returns the root IPFS hash of a directory upload
 *
 * Sample @param uploadedFiles: [
 *  { path: 'release-directory-docker-compose/dappnode_package-no-hashes.json',
 *    hash: 'QmZ5sKqDtgV4J8DM8D1RUziNrsC2Sx8hRw5NXFU8LctJRN',
 *    size: 338 },
 *  { path: 'release-directory-docker-compose/docker-compose-mock-test.yml',
 *    hash: 'QmTp5Rb3k2cyzN7gZpUe4zQ6cMV3FoWJDxJUVfLZDsXhfo',
 *    size: 135 },
 *  { path: 'release-directory-docker-compose/mock-test.public.dappnode.eth_0.0.1.tar.xz',
 *    hash: 'QmP1CbEd5WTUqqKeDxvaDg9noPQNtcpKmcXj3zsqZyKKo8',
 *    size: 637642 },
 *  { path: 'release-directory-docker-compose',
 *    hash: 'QmaRXWSyst18BPyjKiMMKzn94krYEKZaoyVsyoPxh8PzjG',
 *    size: 638350 }
 * ]
 *
 * Sample return of `path.parse`
 * > path.parse("test/a.json")
 * { root: '', dir: 'test', base: 'a.json', ext: '.json', name: 'a' }
 * > path.parse("a.json")
 * { root: '', dir: '', base: 'a.json', ext: '.json', name: 'a' }
 * > path.parse("test")
 * { root: '', dir: '', base: 'test', ext: '', name: 'test' }
 */
function findRootHash(uploadedFiles: IpfsAddResult): string {
  const rootEntries = uploadedFiles.filter(e => !path.parse(e.path).dir);
  if (rootEntries.length === 1) return rootEntries[0].hash;
  else {
    console.log(uploadedFiles);
    throw Error("No releaseEntry found in uploaded release files");
  }
}
