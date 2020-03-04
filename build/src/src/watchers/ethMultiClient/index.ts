import * as db from "../../db";
import * as eventBus from "../../eventBus";
import { installPackage, removePackage } from "../../calls";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { EthClientTarget } from "../../types";
import { getClientData, getEthProviderUrl } from "./clientParams";
import { isSyncing } from "../../utils/isSyncing";
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import Logs from "../../logs";
const logs = Logs(module);

// Create alias to make the main functions more flexible and readable
const setStatus = db.setEthClientStatusAndError;
const setTarget = db.ethClientTarget.set;
const getStatus = db.ethClientStatus.get;
const getTarget = db.ethClientTarget.get;
const setEthProvider = (target: EthClientTarget): void =>
  db.ethProvider.set(getEthProviderUrl(target));

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

  // Always that the client is switching set ethProvider to "remote"
  setEthProvider("remote");

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
  eventBus.runEthProviderWatcher.emit();
  eventBus.requestSystemInfo.emit();
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
  const { name } = getClientData(target);
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
          await installPackage({ name });
          setStatus("installed");
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
        if (await isSyncing(getEthProviderUrl(target))) {
          setStatus("syncing");
        } else {
          setEthProvider(target);
          setStatus("active");
        }
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
  eventBus.runEthProviderWatcher.on(
    runOnlyOneSequentially(async () => {
      try {
        const prevStatus = getStatus();
        await runEthMultiClientWatcher();
        const nextStatus = getStatus();
        if (prevStatus !== nextStatus) {
          // Next run MUST be defered to next event loop for prevStatus to refresh
          setTimeout(eventBus.runEthProviderWatcher.emit, 1000);
          // Update UI with new status
          eventBus.requestSystemInfo.emit();
        }
      } catch (e) {
        logs.error(`Error on eth provider watcher: ${e.stack}`);
      }
    })
  );

  setInterval(eventBus.runEthProviderWatcher.emit, 1 * 60 * 1000);
}
