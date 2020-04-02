import * as db from "../../db";
import * as eventBus from "../../eventBus";
import { installPackage } from "../../calls";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import merge from "deepmerge";
import { getClientData } from "../../modules/ethClient/clientParams";
import {
  EthClientInstallStatus,
  serializeError
} from "../../modules/ethClient/types";
import { packageIsInstalling } from "../../utils/packageIsInstalling";
import Logs from "../../logs";
import { EthClientTarget } from "../../types";
const logs = Logs(module);

// Enforces that the default value of status is correct
type InstallStatus = EthClientInstallStatus["status"];

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
export async function runEthClientInstaller(
  target: EthClientTarget
): Promise<EthClientInstallStatus | null> {
  // Re-check just in case, on run the installer for local target clients
  if (target === "remote") return null;

  const { name, version, userSettings } = getClientData(target);
  const dnp = await listContainerNoThrow(name);

  const installStatus = db.ethClientInstallStatus.get(target);
  const status: InstallStatus = installStatus
    ? installStatus.status
    : "TO_INSTALL";

  if (dnp) {
    // OK: Client is already installed
    return { status: "INSTALLED" };
  } else {
    // Client is not installed

    switch (status) {
      case "INSTALLING":
        // This status has to be verified
        // otherwise it can stay in installing state forever if the dappmanager
        // resets during an installation of the client
        if (packageIsInstalling(name)) {
          // OK: client still installing
          return null;
        } else {
          // Trigger another install
          return { status: "TO_INSTALL" };
        }

      case "TO_INSTALL":
      case "INSTALLING_ERROR":
        // OK: Expected state, run / retry installation
        try {
          db.ethClientInstallStatus.set(target, { status: "INSTALLING" });
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

          // Map fullnode.dappnode to package
          db.fullnodeDomainTarget.set(name);
          // Run nsupdate
          eventBus.packagesModified.emit({ ids: [name] });

          return { status: "INSTALLED" };
        } catch (e) {
          return { status: "INSTALLING_ERROR", error: serializeError(e) };
        }

      case "INSTALLED":
        // NOT-OK: Client should be installed
        // Something or someone removed the client, re-install?
        return null;

      case "UNINSTALLED":
        // OK: Client should be un-installed and is uninstalled
        return null;
    }
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
  // Subscribe with a throttle to run only one time at once
  eventBus.runEthClientInstaller.on(
    runOnlyOneSequentially(async () => {
      try {
        const target = db.ethClientTarget.get();
        if (target && target !== "remote") {
          const prevStatus = db.ethClientInstallStatus.get(target);
          const nextStatus = await runEthClientInstaller(target);
          if (nextStatus) {
            db.ethClientInstallStatus.set(target, nextStatus);
            if (!prevStatus || prevStatus.status !== nextStatus.status)
              // Next run MUST be defered to next event loop for prevStatus to refresh
              setTimeout(eventBus.runEthClientInstaller.emit, 1000);
          }
        }
      } catch (e) {
        logs.error(`Error on eth client installer watcher: ${e.stack}`);
      }
    })
  );

  setInterval(eventBus.runEthClientInstaller.emit, 1 * 60 * 1000);
}
