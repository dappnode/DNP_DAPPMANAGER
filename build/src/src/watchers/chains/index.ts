import * as eventBus from "../../eventBus";
import { listContainers } from "../../modules/docker/listContainers";
import { shortNameCapitalized } from "../../utils/strings";
import params from "../../params";
import { ChainData } from "../../types";
import { supportedProviders, Chain } from "./supportedProviders";
// Drivers
import ethereum from "./ethereum";
import bitcoin from "./bitcoin";
import monero from "./monero";
import Logs from "../../logs";
const logs = Logs(module);

const checkChainWatcherInterval =
  params.CHECK_CHAIN_WATCHER_INTERVAL || 60 * 1000; // 1 minute
const emitChainDataWatcherInterval =
  params.EMIT_CHAIN_DATA_WATCHER_INTERVAL || 5 * 1000; // 5 seconds

const drivers: {
  [driverName: string]: (name: string, api: string) => Promise<ChainData>;
} = {
  ethereum,
  bitcoin,
  monero
};

// This module contains watchers to the different active chains
// It will only emit chain information when at least one ADMIN UI is active
// Every time there is a package install / remove, the watchers will be reseted

const getDriveApi: {
  [driverName: string]: (dnpName: string) => string;
} = {
  // 'http://my.ropsten.dnp.dappnode.eth:8545'
  ethereum: (dnpName: string) => `http://my.${dnpName}:8545`,
  // 'my.bitcoin.dnp.dappnode.eth'
  bitcoin: (dnpName: string) => `my.${dnpName}`,
  // 'http://my.monero.dnp.dappnode.eth:18081'
  monero: (dnpName: string) => `http://my.${dnpName}:18081`
};

const activeChains: { [chainName: string]: Chain } = {};

/**
 * CHAIN MANAGMENT
 * ===============
 * Adds and removes chains from the 'active' list
 * When the chainData fetcher is triggered it will
 * fetch data from those only
 */

function addChain(dnpName: string, driverName?: string): void {
  if (driverName && getDriveApi[driverName]) {
    activeChains[dnpName] = {
      name: shortNameCapitalized(dnpName),
      driverName,
      api: getDriveApi[driverName](dnpName)
    };
  } else {
    activeChains[dnpName] = supportedProviders[dnpName];
  }
}

function removeChain(dnpName: string): void {
  delete activeChains[dnpName];
}

async function checkChainWatchers(): Promise<void> {
  try {
    const dnpList = await listContainers();
    // Remove chains
    for (const dnpName of Object.keys(activeChains)) {
      // If a chain is being watched but is not in the current dnpList
      if (!dnpList.find(dnp => dnp.name === dnpName)) {
        removeChain(dnpName);
      }
    }
    // Add new chains
    for (const dnp of dnpList) {
      // If this dnp is a supported chain, and not currently watched
      if (dnp.chain && !activeChains[dnp.name]) {
        if (drivers[dnp.chain]) {
          addChain(dnp.name, dnp.chain);
        } else {
          logs.warn(
            `DNP ${dnp.name} is requesting an unsupported chain driver: ${
              dnp.chain
            }`
          );
        }
      } else if (supportedProviders[dnp.name] && !activeChains[dnp.name]) {
        addChain(dnp.name);
      }
    }
  } catch (e) {
    logs.error(`Error checking chain watchers: ${e.stack}`);
  }
}

checkChainWatchers();
// Call checkChainWatchers() again in case there was a race condition
// during the DAppNode installation
setTimeout(() => {
  checkChainWatchers();
}, checkChainWatcherInterval);

eventBus.packagesModified.on(() => {
  checkChainWatchers();
});

/**
 * GET CHAIN DATA
 * ==============
 * Calls every active chain if requested,
 * and emits the data to the UI
 */

interface ChainCacheInterface {
  active: boolean;
  lastResult: ChainData;
}
const cache: {
  [chainId: string]: ChainCacheInterface;
} = {};
async function getAndEmitChainData(): Promise<void> {
  const dnpList = await listContainers();
  const chainData = await Promise.all(
    Object.keys(activeChains)
      .filter(dnpName => {
        const dnp = dnpList.find(_dnp => _dnp.name === dnpName);
        return dnp && dnp.running;
      })
      .map(async dnpName => {
        const { name, api, driverName } = activeChains[dnpName];
        if (!cache[api]) cache[api] = {} as ChainCacheInterface;
        // Return last result if previous call is still active
        if (cache[api].active) return cache[api].lastResult;
        // Otherwise raise active flag and perform the request
        cache[api].active = true;

        // Chain .ts file call
        const result: ChainData = await drivers[driverName](name, api).catch(
          (e: Error) => {
            logs.warn(`Error on chain ${name} watcher: ${e.stack}`);
            return {
              name,
              syncing: false,
              error: true,
              message: e.message
            };
          }
        );
        cache[api].active = false;
        cache[api].lastResult = result;
        return result;
      })
  );
  eventBus.chainData.emit(chainData);
}

// When an ADMIN UI is connected it will set params.CHAIN_DATA_UNTIL
// to the current time + 5 minutes. During that time, emitChain data every 5 seconds
setInterval(async () => {
  if (params.CHAIN_DATA_UNTIL > Date.now()) getAndEmitChainData();
}, emitChainDataWatcherInterval);

// Also get and emit chain data immediately after the UI has requested it
eventBus.requestChainData.on(() => {
  getAndEmitChainData();
});

// Don't start new requests if the previous one is still active.
// If it is still active return the last result.
// The current ADMIN UI requires a full array of chain data

// To force this file to be a es6 module and scope variables properly
export {};
