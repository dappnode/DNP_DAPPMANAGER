import * as eventBus from "../../eventBus";
import { listContainers } from "../../modules/docker/listContainers";
import params from "../../params";
import { ChainData } from "../../types";
import { knownChains } from "./knownChains";
// Drivers
import runDriver, { getDriverApi } from "./drivers";
import { logs } from "../../logs";
import { Chain } from "./types";

const checkChainWatcherInterval =
  params.CHECK_CHAIN_WATCHER_INTERVAL || 60 * 1000; // 1 minute
const emitChainDataWatcherInterval =
  params.EMIT_CHAIN_DATA_WATCHER_INTERVAL || 5 * 1000; // 5 seconds

// This module contains watchers to the different active chains
// It will only emit chain information when at least one ADMIN UI is active
// Every time there is a package install / remove, the watchers will be reseted

const activeChains: { [chainName: string]: Chain } = {};

/**
 * CHAIN MANAGMENT
 * ===============
 * Adds and removes chains from the 'active' list
 * When the chainData fetcher is triggered it will
 * fetch data from those only
 */

async function checkChainWatchers(): Promise<void> {
  try {
    const dnpList = await listContainers();

    // Remove chains
    for (const dnpName of Object.keys(activeChains)) {
      // If a chain is being watched but is not in the current dnpList
      if (!dnpList.find(dnp => dnp.name === dnpName)) {
        delete activeChains[dnpName];
      }
    }

    // Add new chains
    for (const dnp of dnpList) {
      if (!activeChains[dnp.name]) {
        if (dnp.chain) {
          const apiUrl = getDriverApi(dnp.chain, dnp.name);
          if (apiUrl)
            activeChains[dnp.name] = {
              dnpName: dnp.name,
              driverName: dnp.chain,
              api: apiUrl
            };
        } else {
          const knownChain = knownChains[dnp.name];
          if (knownChain) activeChains[dnp.name] = knownChain;
        }
      }
    }
  } catch (e) {
    logs.error(`Error checking chain watchers`, e);
  }
}

/**
 * GET CHAIN DATA
 * ==============
 * Calls every active chain if requested,
 * and emits the data to the UI
 */

async function getAndEmitChainData(): Promise<void> {
  const dnpList = await listContainers();

  const chainsToCall: Chain[] = [];
  for (const [dnpName, chain] of Object.entries(activeChains)) {
    const dnp = dnpList.find(_dnp => _dnp.name === dnpName);
    if (dnp && dnp.running) chainsToCall.push(chain);
  }

  const chainData = await Promise.all(
    chainsToCall.map(
      async (chain): Promise<ChainData> => {
        const { dnpName } = chain;
        try {
          const chainDataResult = await runDriver(chain);
          return {
            dnpName,
            ...chainDataResult
          };
        } catch (e) {
          logs.debug(`Error on chain ${dnpName} watcher`, e);
          return {
            dnpName,
            syncing: false,
            error: true,
            message: parseChainErrors(e)
          };
        }
      }
    )
  );
  eventBus.chainData.emit(chainData);
}

/**
 * Reword expected chain errors
 */
function parseChainErrors(error: Error): string {
  if (error.message.includes("ECONNREFUSED"))
    return `DAppNode Package stopped or unreachable (connection refused)`;

  if (error.message.includes("Invalid JSON RPC response"))
    return `DAppNode Package stopped or unreachable (invalid response)`;

  return error.message;
}

/**
 * Chains watcher.
 * Checks which chains are installed and queries their status (syncing + block height)
 */
export default function runWatcher() {
  checkChainWatchers();
  // Call checkChainWatchers() again in case there was a race condition
  // during the DAppNode installation
  setTimeout(() => {
    checkChainWatchers();
  }, checkChainWatcherInterval);

  eventBus.packagesModified.on(() => {
    checkChainWatchers();
  });

  // When an ADMIN UI is connected it will set params.CHAIN_DATA_UNTIL
  // to the current time + 5 minutes. During that time, emitChain data every 5 seconds
  setInterval(async () => {
    if (params.CHAIN_DATA_UNTIL > Date.now()) getAndEmitChainData();
  }, emitChainDataWatcherInterval);

  // Also get and emit chain data immediately after the UI has requested it
  eventBus.requestChainData.on(() => {
    getAndEmitChainData();
  });
}
