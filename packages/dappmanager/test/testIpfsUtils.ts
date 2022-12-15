import fs from "fs";
import path from "path";
import { create, IPFSHTTPClient } from "ipfs-http-client";
import { AddResult } from "ipfs-core-types/src/root";
import { sleep } from "../src/utils/asyncFlows";
import all from "it-all";
import shell from "../src/utils/shell";
import { Manifest } from "@dappnode/dappnodesdk";

const ipfsRemoteUrl = "https://api.ipfs.dappnode.io";
const ipfsTestContainerName = "dappnode_ipfs_host";
const ipfsLocalUrl = "http://localhost";
const ipfsApiPort = "5001";
const ipfsGatewayPort = "8080";
const timeout = 30 * 1000;

export const ipfsGatewayUrl = `${ipfsLocalUrl}:${ipfsGatewayPort}`;
export const ipfsApiUrl = `${ipfsLocalUrl}:${ipfsApiPort}`;

// IPFS remote node for Integration tests

export const remoteIpfsApi: IPFSHTTPClient = create({
  url: ipfsRemoteUrl,
  timeout
});

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
    `docker run --rm -d --name ${ipfsTestContainerName} -p 127.0.0.1:8080:8080 -p 127.0.0.1:5001:5001 ipfs/go-ipfs:v0.12.1`
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

  // Get dappnode ipfs gateway ID
  const dappnodeIpfsGatewayId = await remoteIpfsApi.id().catch(e => {
    throw Error(
      `Error getting dappnode ipfs gateway ID, dappnode ipfs gateway not available ${e}`
    );
  });

  // Connect to ipfs.dappnode.io
  for (const peer of dappnodeIpfsGatewayId.addresses) {
    try {
      await localIpfsApi.swarm.connect(peer);
      await localIpfsApi.bootstrap.add(peer);
    } catch {
      console.warn(`Cannot connect to ${peer}`);
    }
  }
}

/** Set down the testing IPFS node */
export async function setDownIpfsNode(): Promise<void> {
  // Docker stop sends the SIGTERM signal which makes the container to be removed due to the --rm flag
  await shell(`docker stop ${ipfsTestContainerName}`);
}

async function isIpfsNodeAvailable(): Promise<boolean> {
  try {
    return localIpfsApi.isOnline();
  } catch (e) {
    return false;
  }
}

// IPFS utils

/**
 * Upload multiple files to a directory
 * dir is the first result: https://github.com/ipfs/js-ipfs/blob/master/docs/core-api/FILES.md#ipfsaddallsource-options
 * @param path
 * @returns
 */
export async function ipfsAddAll(dirPath: string): Promise<AddResult[]> {
  if (!fs.existsSync(dirPath))
    throw Error(`ipfsAddAll error: no file found at: ${dirPath}`);
  const files = fs.readdirSync(dirPath).map(file => {
    return {
      path: path.join(dirPath, file),
      content: fs.readFileSync(path.join(dirPath, file))
    };
  });
  return all(localIpfsApi.addAll(files));
}

/**
 * Uploads a manifest from memory
 * This should be part of the `DAppNodeSDK`
 */
export async function ipfsAddManifest(manifest: Manifest): Promise<string> {
  const content = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  const addResult = await localIpfsApi.add(content);
  return addResult.cid.toString();
}

/**
 * Uploads a file from the file system
 */
export async function ipfsAddFileFromFs(path: string): Promise<AddResult> {
  if (!fs.existsSync(path))
    throw Error(`ipfsAddFileFromFs error. Not file found at path ${path}`);
  return await localIpfsApi.add(fs.readFileSync(path));
}
