import * as eventBus from "../../eventBus";
import { listPackages } from "../../modules/docker/listContainers";
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
const loggedError: { [chainName: string]: string | null } = {};
let lastEmittedChainData: string;

/**
 * CHAIN MANAGMENT
 * ===============
 * Adds and removes chains from the 'active' list
 * When the chainData fetcher is triggered it will
 * fetch data from those only
 */

async function checkChainWatchers(): Promise<void> {
  try {
    const dnpList = await listPackages();

    // Remove chains
    for (const dnpName of Object.keys(activeChains)) {
      // If a chain is being watched but is not in the current dnpList
      if (!dnpList.find(dnp => dnp.dnpName === dnpName)) {
        delete activeChains[dnpName];
      }
    }

    // Add new chains
    for (const dnp of dnpList) {
      if (!activeChains[dnp.dnpName]) {
        if (dnp.chain) {
          const apiUrl = getDriverApi(dnp.chain, dnp.dnpName);
          if (apiUrl)
            activeChains[dnp.dnpName] = {
              dnpName: dnp.dnpName,
              driverName: dnp.chain,
              api: apiUrl
            };
        } else {
          const knownChain = knownChains[dnp.dnpName];
          if (knownChain) activeChains[dnp.dnpName] = knownChain;
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
  const dnpList = await listPackages();

  const chainsToCall: Chain[] = [];
  for (const [dnpName, chain] of Object.entries(activeChains)) {
    const dnp = dnpList.find(_dnp => _dnp.dnpName === dnpName);
    if (dnp) {
      const container = dnp.containers[0];
      if (container && container.running) {
        chainsToCall.push(chain);
      }
    }
  }

  const chainData = await Promise.all(
    chainsToCall.map(
      async (chain): Promise<ChainData> => {
        const { dnpName } = chain;
        try {
          const chainDataResult = await runDriver(chain);
          loggedError[chain.api] = null; // Reset last seen error
          return {
            dnpName,
            ...chainDataResult
          };
        } catch (e) {
          // Only log chain errors the first time they are seen
          if (loggedError[chain.api] !== e.message)
            logs.debug(`Error on chain ${dnpName} watcher`, e);
          loggedError[chain.api] = e.message;
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

  // Emit chain data only if it has changed
  const emittedChainData = JSON.stringify(chainData);
  if (emittedChainData !== lastEmittedChainData) {
    eventBus.chainData.emit(chainData);
    lastEmittedChainData = emittedChainData;
  }
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
export default function runWatcher(): void {
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
