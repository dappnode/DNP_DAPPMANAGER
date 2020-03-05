import * as db from "../../db";
import * as eventBus from "../../eventBus";
import params from "../../params";
import { ethers } from "ethers";
import { installPackage, removePackage } from "../../calls";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { EthClientTarget, EthClientStatus } from "../../types";
import { getClientData } from "./clientParams";
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import Logs from "../../logs";
import getDirectory from "../../modules/release/getDirectory";
const logs = Logs(module);

// Create alias to make the main functions more flexible and readable

const getTarget = db.ethClientTarget.get;
const setTarget = db.ethClientTarget.set;
const getStatus = db.ethClientStatus.get;

const setStatus = (status: EthClientStatus, e?: Error): void => {
  db.setEthClientStatusAndError(status, e);
  eventBus.requestSystemInfo.emit(); // Update UI with new status
};

const setFullnodeDomainTarget = (dnpName: string): void => {
  db.fullnodeDomainTarget.set(dnpName);
  eventBus.packagesModified.emit({ ids: [dnpName] }); // Run nsupdate
};

/**
 * Returns the url of the JSON RPC an Eth multi-client status and target
 * If the package target is not active it returns the remote URL
 * This causes that during client changes the URL will always point to remote
 *
 * Note: Keep this logic here since it is coupled with the meaning and
 * implementation of ethClientTarget and ethClientStatus
 * @return ethProvier http://geth.dappnode:8545
 */
export function getEthProviderUrl(): string {
  const target = getTarget();
  const status = getStatus();

  if (!target || target === "remote" || status !== "active")
    return params.REMOTE_MAINNET_RPC_URL;
  else return getClientData(target).url;
}

/**
 * Make sure the client is syncing
 * - Check that eth_syncing returns false (WARNING: may return false positive)
 * - Make sure content can be queried
 * - Make sure DAppNode smart contracts can be accessed
 * @param url
 */
export async function isClientSyncing(url: string): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(url);
  const isSyncing = await provider.send("eth_syncing", []);
  if (isSyncing) return true;

  // Do extra checks to make sure the client is actually synced
  const currentBlock = await provider.getBlockNumber();
  if (!currentBlock) return true;

  const directory = await getDirectory();
  if (!directory || directory.length === 0) return true;

  return false;
}

/**
 * Changes the ethereum client used to fetch package data
 * Callable by the client
 * @param nextTarget Ethereum client to change to
 * @param deleteVolumes If changing from a package client, delete its data
 */
export async function changeEthMultiClient(
  nextTarget: EthClientTarget,
  deleteVolumes?: boolean
): Promise<void> {
  const prevTarget = getTarget();
  if (prevTarget === nextTarget) throw Error("Same target");

  // If the previous client is a client package, uninstall it
  if (prevTarget !== "remote") {
    const { name } = getClientData(prevTarget);
    removePackage({ id: name, deleteVolumes }).catch(e => {
      logs.error(`Error removing previous ETH multi-client: ${e.stack}`);
    });
  }

  // Setting the status to selected will trigger an install
  setTarget(nextTarget);
  setStatus("selected");
  eventBus.runEthMultiClientWatcher.emit();
}

/**
 * Check status of the Ethereum client and do next actions
 * This function should be run:
 * - every interval
 * - after changing the client
 * - after completing a run if the status has changed
 *
 * This architecture is used for debuggability and to be fail-safe
 * At any point the client can query the DB and see clear status
 * It makes it easier to know what will happen next given a status
 * It also retries each step automatically without added logic
 */
export async function runEthMultiClientWatcher(): Promise<void> {
  const target = getTarget();

  if (target === "remote") {
    // Do nothing
    return;
  }

  const status = getStatus();
  const { name, url, userSettings } = getClientData(target);
  const dnp = await listContainerNoThrow(name);

  // Client is not installed
  if (!dnp) {
    switch (status) {
      case "installing":
        // OK client still installing
        return;

      case "selected":
      case "error-installing":
        // Expected state, run / retry installation
        try {
          setStatus("installing");
          await installPackage({
            name,
            userSettings: { [name]: userSettings || {} }
          });
          setStatus("installed");
          setFullnodeDomainTarget(name); // Map fullnode.dappnode to package
        } catch (e) {
          setStatus("error-installing", e);
        }
        return;

      default:
        // NOT-OK Client should be installed
        // Something or someone removed the client, re-install?
        return;
    }
  }

  // Client is installed but not running
  if (!dnp.running) {
    // Package can be stopped because the user stopped it or
    // because the DAppNode is too full and auto-stop kicked in
    // For now, do nothing
    return;
  }

  // Client installed and running
  switch (status) {
    case "active":
      // OK client is synced and active
      return;

    case "installed":
    case "syncing":
    case "error-syncing":
      // Check if client is already synced
      try {
        if (await isClientSyncing(url)) setStatus("syncing");
        else setStatus("active");
      } catch (e) {
        setStatus("error-syncing", e);
      }
      return;

    case "selected":
    case "installing":
    case "error-installing":
      // Client is already installed but the status was not updated
      // This may happen if the client was already installed by the user
      // or after a migration before having this functionality
      setStatus("installed");
      return;

    default:
      // Should never reach this point, all status covered
      return;
  }
}

/**
 * Eth multi-client watcher. Handles ETH client switching logic
 * Must run:
 * - every interval
 * - after changing the client
 * - after completing a run if the status has changed
 */
export default function runWatcher(): void {
  eventBus.runEthMultiClientWatcher.on(
    runOnlyOneSequentially(async () => {
      try {
        const prevStatus = getStatus();
        await runEthMultiClientWatcher();
        const nextStatus = getStatus();
        if (prevStatus !== nextStatus)
          // Next run MUST be defered to next event loop for prevStatus to refresh
          setTimeout(eventBus.runEthMultiClientWatcher.emit, 1000);
      } catch (e) {
        logs.error(`Error on eth provider watcher: ${e.stack}`);
      }
    })
  );

  setInterval(eventBus.runEthMultiClientWatcher.emit, 1 * 60 * 1000);
}
