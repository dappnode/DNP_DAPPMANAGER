const Client = require("bitcoin-core");
import shell from "../../../utils/shell";
import params from "../../../params";
import { ChainDataResult } from "../types";

const getMinBlockDiffSync = (api: string): number =>
  // minTimeDiff = 30 min
  api.includes("bitcoin")
    ? 30 / 10
    : // ZCash, Litecoin, etc
      30 / 2.5;

const apiPrefix = "my.";

// After revising 'bitcoin-core' source code,
// there is no problem in creating a new instance of Client on each request

// Cache the blockIndex to prevent unnecessary calls
const cache: {
  [api: string]: {
    block: number;
    blockIndex: number;
  };
} = {};

/**
 * Returns a chain data object for a [bitcoin] API
 * @param api = "my.bitcoin.dnp.dappnode.eth"
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
export async function bitcoin(api: string): Promise<ChainDataResult> {
  // To initialize the bitcoin client, the RPC user and password are necessary
  // They are stored in the package envs
  const containerName = getContainerNameFromApi(api);
  const cmd = `docker inspect --format='{{.Config.Env}}' ${containerName}`;
  const envsString = await shell(cmd);
  if (!envsString) throw Error(`Error reading ${containerName} ENVs`);
  const { username, password, port } = parseCredentialsFromEnvs(envsString);

  const client = new Client({
    host: api,
    username,
    password,
    port // If port is falsy, it will take the default value. From source code: `this.port = port || networks[network];`
  });
  const blockIndex = await client.getBlockCount();
  // If the cached blockIndex is the same, return cached block
  const block =
    (cache[api] || {}).blockIndex === blockIndex
      ? cache[api].block
      : await client.getBlockHash(blockIndex).then(client.getBlock);
  // Update cached values
  cache[api] = { blockIndex, block };
  const secondsDiff = Math.floor(Date.now() / 1000) - block.time;
  const blockDiffAprox = Math.floor(secondsDiff / (60 * 10));

  if (blockDiffAprox > getMinBlockDiffSync(api))
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
 * @param envLine
 * "[BTC_RPCUSER=dappnode BTC_RPCPASSWORD=dappnode BTC_TXINDEX=1 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]"
 * "[ZCASH_RPCUSER=dappnode ZCASH_RPCPASSWORD=dappnode ZCASH_RPCPORT=8342 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin]"
 */
export function parseCredentialsFromEnvs(
  envLine: string
): {
  username: string;
  password: string;
  port: number | null;
} {
  const envLineClean = envLine.replace("[", "").replace("]", "");
  const envPairs = envLineClean.split(" ").map(envPair => {
    const [key, value] = (envPair || "").trim().split(/=(.*)/);
    return { key, value };
  });
  const userEnv = envPairs.find(({ key }) => key.includes("_RPCUSER"));
  const passEnv = envPairs.find(({ key }) => key.includes("_RPCPASSWORD"));
  const portEnv = envPairs.find(({ key }) => key.includes("_RPCPORT"));
  if (!userEnv || !userEnv.value) throw Error("Couldn't get RPCUSER");
  if (!passEnv || !passEnv.value) throw Error("Couldn't get RPCPASSWORD");
  const port = portEnv ? portEnv.value : null;
  return {
    username: userEnv.value,
    password: passEnv.value,
    port: port && !isNaN(parseInt(port)) ? parseInt(port) : null
  };
}

export function getContainerNameFromApi(api: string): string {
  const dnpName = api.split(apiPrefix)[1];
  if (!dnpName) throw Error(`Expected API format my.<dnpName>`);
  return `${params.CONTAINER_NAME_PREFIX}${dnpName}`;
}
