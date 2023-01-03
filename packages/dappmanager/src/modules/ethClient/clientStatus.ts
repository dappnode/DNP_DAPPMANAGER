import { ethers } from "ethers";
import * as db from "../../db";
import {
  ConsensusClientMainnet,
  consensusClientsMainnet,
  EthClientStatus,
  ExecutionClientMainnet,
  executionClientsMainnet
} from "@dappnode/common";
import { listPackageNoThrow } from "../../modules/docker/list";
import { serializeError } from "./types";
import { getEthExecClientApiUrl, getEthConsClientApiUrl } from "./apiUrl";
import { parseEthersBlock, parseEthersSyncing } from "../../utils/ethers";
import { logs } from "../../logs";
import fetch from "node-fetch";
import params from "../../params";

/**
 * 7200 is the average blocks per day in Ethereum as Mon Nov 28 2022
 * src: https://ycharts.com/indicators/ethereum_blocks_per_day#:~:text=Ethereum%20Blocks%20Per%20Day%20is,12.10%25%20from%20one%20year%20ago.
 * TODO: find a way to get the average blocks per day dynamicallly
 */
const ETHEREUM_BLOCKS_PER_DAY = 7200;

/**
 * Minimum block difference to consider a local ethereum mainnet node synced
 * if  highestBlock = 1000005
 * and currentBlock = 1000000
 * and minDiff = 50
 * The node will be considered synced
 */
const MIN_ETH_BLOCK_DIFF_SYNC = 60;

/**
 * Goal:
 *  - Fastest possible success path, minimize number of call
 *  - Capture current state with a much details as possible
 *
 * All possible status
 * - Provider API works
 *   - Package is syncing
 *   - Package is synced
 *   - Test call fails
 *   - Test call succeeds
 * - Provider API does not work
 *   - DNP is installed
 *     - DNP is not running
 *     - DNP is running
 *   - DNP is not installed
 *     - DNP is installing
 *     - DNP is has not installed
 *     - DNP had install error
 *     - DNP was uninstalled
 *
 * Note: MUST NOT have undefined as a valid return type so typescript
 *       enforces that all possible states are covered
 */
export async function getMultiClientStatus(
  execClientDnpName: ExecutionClientMainnet,
  consClientDnpName: ConsensusClientMainnet
): Promise<EthClientStatus> {
  try {
    if (!executionClientsMainnet.includes(execClientDnpName))
      throw Error(
        `Unsupported execution client in mainnet '${execClientDnpName}'`
      );
    if (!consensusClientsMainnet.includes(consClientDnpName))
      throw Error(
        `Unsupported consensus client in mainnet '${consClientDnpName}'`
      );
    const execUrl = getEthExecClientApiUrl(execClientDnpName);
    const consUrl = await getEthConsClientApiUrl(consClientDnpName);
    try {
      // Provider API works? Do a single test call to check state
      if (await isSyncing(execUrl)) {
        return { ok: false, code: "IS_SYNCING" };
      } else {
        const _isApmStateCorrect = await isApmStateCorrect(execUrl).catch(
          eFromTestCall => {
            // APM state call failed, syncing call succeeded and is not working
            // = Likely an error related to fetching state content
            return {
              ok: false,
              code: "STATE_CALL_ERROR",
              error: serializeError(eFromTestCall)
            };
          }
        );
        if (_isApmStateCorrect) {
          // State contract is okey!!
          // Check is synced with consensus and remote execution
          if (
            (await isSyncedWithConsensus(execUrl, consUrl).catch(e => {
              throw Error(
                `Error while checking if synced with consensus: ${e.message}`
              );
            })) &&
            (await isSyncedWithRemoteExecution(execUrl).catch(e => {
              // Do not throw if checking remote execution fails
              // Otherwise the fallback will be triggered and the remote node may not be available
              logs.error(
                `Error while checking if synced with remote execution: ${e.message}`
              );
            }))
          )
            return { ok: true, url: execUrl, dnpName: execClientDnpName };
          else return { ok: false, code: "IS_SYNCING" };
        } else {
          // State is not correct, node is not synced but eth_syncing did not picked it up
          return {
            ok: false,
            code: "STATE_NOT_SYNCED"
          };
        }
      }
    } catch (clientError) {
      // syncing call failed, the node is not available, find out why
      const dnp = await listPackageNoThrow({ dnpName: clientError.client });

      if (dnp) {
        // DNP is installed
        if (dnp.containers[0]?.running) {
          // syncing call failed, but the client is running
          // ???, a connection error?
          return {
            ok: false,
            code: "NOT_AVAILABLE",
            error: serializeError(clientError)
          };
        } else {
          return {
            ok: false,
            code: "NOT_RUNNING"
          };
        }
      } else {
        // DNP is not installed, figure out why
        const installStatus =
          db.ethExecClientInstallStatus.get(execClientDnpName);
        if (installStatus) {
          switch (installStatus.status) {
            case "TO_INSTALL":
            case "INSTALLING":
              return {
                ok: false,
                code: "INSTALLING"
              };
            case "INSTALLING_ERROR":
              return {
                ok: false,
                code: "INSTALLING_ERROR",
                error: installStatus.error
              };
            case "INSTALLED":
              return {
                ok: false,
                code: "UNINSTALLED"
              };
            case "UNINSTALLED":
              return {
                ok: false,
                code: "NOT_INSTALLED"
              };
          }
        } else {
          return {
            ok: false,
            code: "NOT_INSTALLED"
          };
        }
      }
    }
  } catch (eGeneric) {
    return {
      ok: false,
      code: "UNKNOWN_ERROR",
      error: eGeneric
    };
  }
}

/**
 * Check the latest block of the local execution client
 * with the latest block of the remote execution client:
 * - If the difference is smaller than ETHEREUM_BLOCKS_PER_DAY, the node is synced
 * - If the difference is bigger than ETHEREUM_BLOCKS_PER_DAY, the node is not synced
 */
async function isSyncedWithRemoteExecution(localUrl: string): Promise<boolean> {
  if (db.ethClientFallback.get() === "off") return true;
  // Check is synced with remote execution
  const latestLocalBlock = await new ethers.providers.JsonRpcProvider(localUrl)
    .send("eth_blockNumber", [])
    .then(parseEthersBlock);

  const latestRemoteBlock = await new ethers.providers.JsonRpcProvider(
    params.ETH_MAINNET_RPC_URL_REMOTE
  )
    .send("eth_blockNumber", [])
    .then(parseEthersBlock);

  const blockDiff = latestLocalBlock - latestRemoteBlock;
  if (blockDiff < ETHEREUM_BLOCKS_PER_DAY) return true;
  else return false;
}

/**
 * Test if a node is synced
 * @param url "http://geth.dappnode:8545"
 */
async function isSyncing(url: string): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(url);
  const syncing = await provider
    .send("eth_syncing", [])
    .then(parseEthersSyncing);

  if (!syncing) return false;

  // The bigger the far from synced
  const currentBlockDiff = syncing.highestBlock - syncing.currentBlock;
  // If block diff is small, consider it already synced
  if (currentBlockDiff < MIN_ETH_BLOCK_DIFF_SYNC) return false;
  else return true;
}

/**
 * Test if contract data can be retrieved from an APM smart contract
 * This check asserts that:
 * - Node is available at provided URL
 * - State is queriable
 * - Node is almost fully synced
 * @param url
 */
async function isApmStateCorrect(url: string): Promise<boolean> {
  // Call to dappmanager.dnp.dappnode.eth, getByVersionId(35)
  // Returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)
  const testTxData = {
    to: "0x0c564ca7b948008fb324268d8baedaeb1bd47bce",
    data: "0x737e7d4f0000000000000000000000000000000000000000000000000000000000000023"
  };
  const result =
    "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000342f697066732f516d63516958454c42745363646278464357454a517a69664d54736b4e5870574a7a7a5556776d754e336d4d4361000000000000000000000000";

  const provider = new ethers.providers.JsonRpcProvider(url);

  const res = await provider.send("eth_call", [testTxData, "latest"]);
  return res === result;
}

/**
 * Fetches the latest block from the consensus client and the execution client and
 * compares it, if it is greater than 7200 blocks behind, it is considered not synced
 * @param execUrl
 * @param consUrl
 * @returns true if synced, false if not synced
 */
async function isSyncedWithConsensus(
  execUrl: string,
  consUrl: string
): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(execUrl);
  const execBlockNumber = await provider.getBlockNumber();
  const execBlockHeadersResponse = await fetch(
    consUrl + "/eth/v2/beacon/blocks/head"
  );
  const consBlockHeadersResponseParsed = await execBlockHeadersResponse.json();
  const consBlockNumber =
    consBlockHeadersResponseParsed.data.message.body.execution_payload
      .block_number;

  if (execBlockNumber - consBlockNumber < ETHEREUM_BLOCKS_PER_DAY) {
    return true;
  } else {
    logs.info(
      `Execution and Consensus are too far each other. Execution client block: ${execBlockNumber}. Consensus client block: ${consBlockNumber}.`
    );
    return false;
  }
}
