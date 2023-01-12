// @ts-ignore
import Client from "bitcoin-core";
import { InstalledPackageData } from "@dappnode/common";
import { dockerContainerInspect } from "../../docker";
import { parseEnvironment } from "../../compose";
import { getPrivateNetworkAlias } from "../../../domains";
import { ChainDataResult } from "../types";

function getMinBlockDiffSync(dnpName: string): number {
  return dnpName.includes("bitcoin")
    ? // minTimeDiff = 30 min
      30 / 10
    : // ZCash, Litecoin, etc
      30 / 2.5;
}

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
export async function bitcoin(
  dnp: InstalledPackageData
): Promise<ChainDataResult> {
  const container = dnp.containers[0];
  if (!container) throw Error("no container");
  const containerDomain = getPrivateNetworkAlias(container);
  const apiUrl = containerDomain; // 'bitcoin.dappnode'

  // To initialize the bitcoin client, the RPC user and password are necessary
  // They are stored in the package envs
  const containerName = dnp.containers[0].containerName;
  const containerData = await dockerContainerInspect(containerName);
  const { username, password, port } = parseCredentialsFromEnvs(
    containerData.Config.Env
  );

  // After revising 'bitcoin-core' source code,
  // there is no problem in creating a new instance of Client on each request
  const client = new Client({
    host: apiUrl,
    username,
    password,
    port // If port is falsy, it will take the default value. From source code: `this.port = port || networks[network];`
  });
  const blockIndex = await client.getBlockCount();

  // If the cached blockIndex is the same, return cached block
  const cachedBlock = blockCache.get(apiUrl);
  const block =
    cachedBlock && cachedBlock.blockIndex === blockIndex
      ? cachedBlock.block
      : await client.getBlockHash(blockIndex).then(client.getBlock);

  // Update cached values
  blockCache.set(apiUrl, { blockIndex, block });
  const secondsDiff = Math.floor(Date.now() / 1000) - block.time;
  const blockDiffAprox = Math.floor(secondsDiff / (60 * 10));

  if (blockDiffAprox > getMinBlockDiffSync(dnp.dnpName))
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
 * @param envLines
 * "Env": [
 *   "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
 *   "OPENVPN=/etc/openvpn",
 *   "DEFAULT_ADMIN_USER=dappnode_admin",
 *   "EASYRSA=/usr/share/easy-rsa",
 * ]
 * "[BTC_RPCUSER=dappnode BTC_RPCPASSWORD=dappnode BTC_TXINDEX=1 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]"
 * "[ZCASH_RPCUSER=dappnode ZCASH_RPCPASSWORD=dappnode ZCASH_RPCPORT=8342 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]"
 */
export function parseCredentialsFromEnvs(envsArray: string[]): {
  username: string;
  password: string;
  port: number | null;
} {
  const envs = parseEnvironment(envsArray);
  const keys = Object.keys(envs);

  // Find keys for both bitcoin and zcash packages
  const userKey = keys.find(key => key.includes("_RPCUSER"));
  const passKey = keys.find(key => key.includes("_RPCPASSWORD"));
  const portKey = keys.find(key => key.includes("_RPCPORT"));

  if (!userKey) throw Error("RPCUSER not defined");
  if (!passKey) throw Error("RPCPASSWORD not defined");

  const username = envs[userKey];
  const password = envs[passKey];
  const port = portKey ? parseInt(envs[portKey]) || null : null;

  return { username, password, port };
}
