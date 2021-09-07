import fs from "fs";
import path from "path";
import { ipfs } from "../src/modules/ipfs/local";
import { Manifest } from "../src/types";
import { globSource } from "ipfs-http-client";
import shell from "../src/utils/shell";
import { absoluteTestDir } from "./testUtils";
import { sleep } from "../src/utils/asyncFlows";

const ipfsStagingPath = path.join(absoluteTestDir, "ipfs_staging");
const ipfsDataPath = path.join(absoluteTestDir, "ipfs_data");
const ipfsTestContainerName = "dappnode_ipfs_host";

/**
 * Util, IPFS wrapper with type info
 */

type IpfsAddResult = {
  path: string;
  hash: string;
  size: number;
};

/**
 * Wrapper to abstract converting the return values of ipfs.add
 * @param content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ipfsAdd(content: any): Promise<IpfsAddResult> {
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
): Promise<IpfsAddResult> {
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

// Set Up an IPFS node for testing purposes on localhost
// source: https://docs.ipfs.io/how-to/run-ipfs-inside-docker/
export async function setUpIpfsNode(): Promise<void> {
  await createIpfsDIrs();
  await shell(
    `docker run -d --name ${ipfsTestContainerName} -v ${ipfsStagingPath}:/export -v ${ipfsDataPath}:/data/ipfs -p 4001:4001 -p 4001:4001/udp -p 127.0.0.1:8080:8080 -p 127.0.0.1:5001:5001 ipfs/go-ipfs:latest`
  );
  // Timeout for container to be initialized
  await sleep(5000);
}

// Set down the testing IPFS node
export async function setDownIpfsNode(): Promise<void> {
  await shell(`docker stop ${ipfsTestContainerName}`);
  await shell(`docker rm ${ipfsTestContainerName}`);
  await removeIPfsDirs();
}

// Create necessary dirs for the IPFS node
async function createIpfsDIrs(): Promise<void> {
  await shell(`mkdir -p ${ipfsStagingPath}`);
  await shell(`mkdir -p ${ipfsDataPath}`);
}

// Remove dirs from the IPFS node
async function removeIPfsDirs(): Promise<void> {
  await shell(`rm -rf ${ipfsStagingPath}`);
  await shell(`rm -rf ${ipfsDataPath}`);
}
