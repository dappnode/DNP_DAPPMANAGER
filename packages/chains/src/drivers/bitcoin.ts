import { InstalledPackageData } from "@dappnode/types";
import { dockerContainerInspect } from "@dappnode/dockerapi";
import { buildNetworkAlias, parseEnvironment } from "@dappnode/utils";
import { ChainDataResult } from "../types.js";
import { request } from "http";
import { URL } from "url";
import { Buffer } from "buffer";

function getMinBlockDiffSync(dnpName: string): number {
  return dnpName.includes("bitcoin")
    ? // minTimeDiff = 30 min
      30 / 10
    : // ZCash, Litecoin, etc
      30 / 2.5;
}

// Cache the block data to prevent unnecessary calls
const blockCache = new Map<string, { block: any; blockIndex: number }>();

/**
 * Makes a JSON-RPC call to the specified URL with the given method and parameters.
 * @param rpcUrl The full URL of the JSON-RPC endpoint.
 * @param username The username for basic auth.
 * @param password The password for basic auth.
 * @param method The JSON-RPC method to call.
 * @param params The parameters for the method.
 * @returns The result of the JSON-RPC call.
 */
async function rpcCall(
  rpcUrl: string,
  username: string,
  password: string,
  method: string,
  params: any[] = []
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(rpcUrl);

    const postData = JSON.stringify({
      jsonrpc: "1.0",
      id: "dappnode_monitoring",
      method,
      params,
    });

    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        Authorization: `Basic ${auth}`,
      },
    };

    const req = request(options, (res) => {
      let data = "";

      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            reject(new Error(parsed.error.message));
          } else {
            resolve(parsed.result);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Returns a chain data object for a [bitcoin] API
 * @returns
 * - On success:
 *   - syncing: boolean
 *   - message: string
 *   - progress: number (if syncing)
 * - On error:
 *   - message: string
 *   - error: boolean
 */
export async function bitcoin(
  dnp: InstalledPackageData
): Promise<ChainDataResult> {
  try {
    const container = dnp.containers[0];
    if (!container) throw new Error("No container found");

    const { dnpName, serviceName } = container;

    const containerDomain = buildNetworkAlias({
      dnpName,
      serviceName,
      isMainOrMonoservice: true,
    });

    // Retrieve RPC credentials from container environment variables
    const containerName = container.containerName;
    const containerData = await dockerContainerInspect(containerName);
    const { username, password, port } = parseCredentialsFromEnvs(
      containerData.Config.Env
    );

    if (!port) {
      throw new Error("RPC port not defined");
    }

    const apiUrl = `http://${containerDomain}:${port}/`;

    // Fetch block count
    const blockIndex = await rpcCall(
      apiUrl,
      username,
      password,
      "getblockcount"
    );

    // Check and utilize cached block data if available
    const cachedBlockData = blockCache.get(apiUrl);
    let block: any;

    if (cachedBlockData && cachedBlockData.blockIndex === blockIndex) {
      block = cachedBlockData.block;
    } else {
      // Fetch block hash
      const blockHash = await rpcCall(
        apiUrl,
        username,
        password,
        "getblockhash",
        [blockIndex]
      );

      // Fetch block data
      block = await rpcCall(apiUrl, username, password, "getblock", [
        blockHash,
      ]);

      // Update cache
      blockCache.set(apiUrl, { blockIndex, block });
    }

    const blockTime = block.time; // Unix timestamp
    const currentTime = Math.floor(Date.now() / 1000); // Current Unix timestamp
    const secondsDiff = currentTime - blockTime;
    const blockTimeInMinutes = 10; // For Bitcoin
    const blockDiffApprox = Math.floor(secondsDiff / (60 * blockTimeInMinutes));

    if (blockDiffApprox > getMinBlockDiffSync(dnp.dnpName)) {
      const estimatedTotalBlocks = blockIndex + blockDiffApprox;
      const progress = blockIndex / estimatedTotalBlocks;

      return {
        syncing: true,
        error: false,
        message: `Blocks synced: ${blockIndex} / ${estimatedTotalBlocks}`,
        progress,
      };
    } else {
      return {
        syncing: false,
        error: false,
        message: `Synced #${blockIndex}`,
      };
    }
  } catch (error: any) {
    return {
      syncing: false,
      error: true,
      message: `Error: ${error.message}`,
    };
  }
}

// Utility function

/**
 * Parses the username, password, and port from the environment variables.
 * @param envsArray Array of environment variable strings.
 * @returns An object containing username, password, and port.
 */
export function parseCredentialsFromEnvs(envsArray: string[]): {
  username: string;
  password: string;
  port: number | null;
} {
  const envs = parseEnvironment(envsArray);
  const keys = Object.keys(envs);

  // Identify keys related to RPC credentials
  const userKey = keys.find((key) => key.includes("_RPCUSER"));
  const passKey = keys.find((key) => key.includes("_RPCPASSWORD"));
  const portKey = keys.find((key) => key.includes("_RPCPORT"));

  if (!userKey) throw new Error("RPCUSER not defined in environment variables");
  if (!passKey)
    throw new Error("RPCPASSWORD not defined in environment variables");

  const username = envs[userKey];
  const password = envs[passKey];
  const port = portKey ? parseInt(envs[portKey], 10) || null : null;

  return { username, password, port };
}
