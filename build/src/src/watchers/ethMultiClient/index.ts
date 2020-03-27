import * as db from "../../db";
import * as eventBus from "../../eventBus";
import { ethers } from "ethers";
import { installPackage } from "../../calls";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import merge from "deepmerge";
import { getClientData } from "../../modules/ethClient/clientParams";
import {
  getTarget,
  getStatus,
  setStatus,
  setFullnodeDomainTarget
} from "../../modules/ethClient/utils";
import Logs from "../../logs";
const logs = Logs(module);

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

  // ### TODO: Fetch some specific APM data

  return false;
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
  const { name, version, url, userSettings } = getClientData(target);
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
            version,
            userSettings: {
              [name]: merge(
                // Merge the default user settings with any customization from the user
                userSettings || {},
                db.ethClientUserSettings.get(target) || {}
              )
            }
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
