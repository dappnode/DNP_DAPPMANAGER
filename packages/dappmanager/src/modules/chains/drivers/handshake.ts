const Client = require("hs-client").NodeClient;
import { InstalledPackageData } from "../../../types";
import { dockerContainerInspect } from "../../docker";
import { parseEnvironment } from "../../compose";
import { getPrivateNetworkAlias } from "../../../domains";
import { ChainDataResult } from "../types";

// Cache the blockIndex to prevent unnecessary calls
const blockCache = new Map<string, { block: number; blockIndex: number }>();

/**
 * Returns a chain data object for a [bitcoin] API
 * @returns
 * - On success: {
 *   syncing: true, {bool}
 *   message: "Blocks synced: 543000 / 654000", {string}
 *   progress: 0.83027522935,
 * }
 * - On error: {
 *   message: "Could not connect to RPC", {string}
 *   error: true {bool},
 * }
 */
export async function handshake(
  dnp: InstalledPackageData
): Promise<ChainDataResult> {

  const container = dnp.containers[0];
  if (!container) throw Error("no container");
  const apiUrl = getPrivateNetworkAlias(container); // 'handshake.dappnode'

  // To initialize the handshake client, the RPC user and password are necessary
  // They are stored in the package envs
  const containerName = dnp.containers[0].containerName;
  const containerData = await dockerContainerInspect(containerName);
  const { username, password, port } = parseCredentialsFromEnvs(
    containerData.Config.Env
  );

  const client = new Client({
    host: apiUrl,
    username,
    password,
    port: port || 12037 // If port is falsy, use mainnet
  });

  const blockIndex = (await client.getInfo()).chain.height;

  // If the cached blockIndex is the same, return cached block
  const cachedBlock = blockCache.get(apiUrl);
  const block =
    cachedBlock && cachedBlock.blockIndex === blockIndex
      ? cachedBlock.block
      : await client.getBlock(blockIndex);

  // Update cached values
  blockCache.set(apiUrl, { blockIndex, block });
  const secondsDiff = Math.floor(Date.now() / 1000) - block.time;
  const blockDiffAprox = Math.floor(secondsDiff / (60 * 10));

  // minTimeDiff = 30 min
  if (blockDiffAprox > 30 / 10)
    return {
      syncing: true,
      error: false,
      message: `Blocks synced: ${blockIndex} / ${blockDiffAprox + blockIndex}`,
      progress: blockIndex / (blockDiffAprox + blockIndex)
    };
  else
    return {
      syncing: false,
      error: false,
      message: `Synced #${blockIndex}`
    };
}

// Util

/**
 * Parses the username and password from the ENVs in a one line format
 * @param envsArray
 * "Env": [
 *   "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
 *   "OPENVPN=/etc/openvpn",
 *   "DEFAULT_ADMIN_USER=dappnode_admin",
 *   "EASYRSA=/usr/share/easy-rsa",
 * ]
 * "[HNS_RPCPASSWORD=dappnode HNS_TXINDEX=1 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]"
 */
export function parseCredentialsFromEnvs(
  envsArray: string[]
): {
  username: string;
  password: string;
  port: number | null;
} {
  const envs = parseEnvironment(envsArray);
  const keys = Object.keys(envs);

  // Find keys
  const passKey = keys.find(key => key.includes("HSD_API_KEY"));
  const portKey = keys.find(key => key.includes("HSD_HTTP_PORT"));

  if (!passKey) throw Error("HSD_API_KEY not defined");

  const username = "x";
  const password = envs[passKey];
  const port = portKey ? parseInt(envs[portKey]) || null : null;

  return { username, password, port };
}
