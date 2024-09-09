import { create } from "kubo-rpc-client";
import { sleep, shell } from "@dappnode/utils";

const ipfsRemoteUrl = "https://api.ipfs.dappnode.io";
const ipfsTestContainerName = "dappnode_ipfs_host";
const ipfsLocalUrl = "http://127.0.0.1";
const ipfsApiPort = "5001";
const ipfsGatewayPort = "8080";
const timeout = 30 * 1000;

export const ipfsGatewayUrl = `${ipfsLocalUrl}:${ipfsGatewayPort}`;
export const ipfsApiUrl = `${ipfsLocalUrl}:${ipfsApiPort}`;

// IPFS remote node for Integration tests

export const remoteIpfsApi = create({
  url: ipfsRemoteUrl,
  timeout
});

// IPFS local node for Integration tests

export const localIpfsApi = create({ url: ipfsApiUrl, timeout });

export const localIpfsGateway = create({
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
    `docker run --rm -d --name ${ipfsTestContainerName} -p 127.0.0.1:8080:8080 -p 127.0.0.1:5001:5001 ipfs/kubo:v0.29.0`
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
  const dappnodeIpfsGatewayId = await remoteIpfsApi.id().catch((e) => {
    throw Error(`Error getting dappnode ipfs gateway ID, dappnode ipfs gateway not available ${e}`);
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
    await localIpfsApi.version();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
