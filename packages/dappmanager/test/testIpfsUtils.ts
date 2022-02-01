import fs from "fs";
import { Manifest } from "../src/types";
import {
  globSource,
  multiaddr,
  create,
  IPFSHTTPClient
} from "ipfs-http-client";
import { sleep } from "../src/utils/asyncFlows";
import shell from "../src/utils/shell";

const ipfsDappnodeAddress =
  "/dns4/ipfs.dappnode.io/tcp/4001/ipfs/QmfB6dT5zxUq1BXiXisgcZKYkvjywdDYBK5keRaqDKH633";
const ipfsTestContainerName = "dappnode_ipfs_host";
const ipfsLocalUrl = "http://localhost";
const ipfsApiPort = "5001";
const ipfsGatewayPort = "8080";
const timeout = 30 * 1000;

export const ipfsGatewayUrl = `${ipfsLocalUrl}:${ipfsGatewayPort}`;
export const ipfsApiUrl = `${ipfsLocalUrl}:${ipfsApiPort}`;

type IpfsAddResult = {
  path: string;
  hash: string;
  size: number;
};

// IPFS local node for Integration tests

export const localIpfsApi: IPFSHTTPClient = create({
  url: ipfsApiUrl,
  timeout
});

export const localIpfsGateway: IPFSHTTPClient = create({
  url: ipfsGatewayUrl,
  timeout
});

/**
 * Set Up an IPFS node for testing purposes on localhost.
 * source: https://docs.ipfs.io/how-to/run-ipfs-inside-docker/
 */
export async function setUpIpfsNode(): Promise<void> {
  // Startup ipfs container
  await shell(
    `docker run --rm -d --name ${ipfsTestContainerName} -p 127.0.0.1:8080:8080 -p 127.0.0.1:5001:5001 ipfs/go-ipfs:v0.9.1`
  );

  // Wait until ipfs is available
  let isIpfsAvail = false;
  let counter = 0;
  while (!isIpfsAvail) {
    isIpfsAvail = await isIpfsNodeAvailable();
    await sleep(1000);
    counter++;
    if (counter === 30) throw Error("Error starting up local IPFS node");
  }

  // Connect to ipfs.dappnode.io
  await connectToDappnodeIpfs();
}

/** Set down the testing IPFS node */
export async function setDownIpfsNode(): Promise<void> {
  // Docker stop sends the SIGTERM signal which makes the container to be removed due to the --rm flag
  await shell(`docker stop ${ipfsTestContainerName}`);
}

/** Add ipfs.dappnode.io swarm connection */
async function connectToDappnodeIpfs(): Promise<void> {
  await localIpfsApi.swarm.connect(ipfsDappnodeAddress);
  await localIpfsApi.bootstrap.add(multiaddr(ipfsDappnodeAddress));
}

async function isIpfsNodeAvailable(): Promise<boolean> {
  try {
    await localIpfsApi.version();
    return true;
  } catch (e) {
    return false;
  }
}

// IPFS utils

/**
 * Wrapper to abstract converting the return values of ipfs.add
 * @param content
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ipfsAdd(content: any): Promise<IpfsAddResult> {
  const addResult = await localIpfsApi.add(content);
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
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
