import * as db from "../../db";
import * as eventBus from "../../eventBus";
import { ethClientData } from "../../params";
import { packageInstall } from "../../calls";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import merge from "deepmerge";
import {
  EthClientInstallStatus,
  serializeError
} from "../../modules/ethClient/types";
import { logs } from "../../logs";
import { EthClientTarget } from "../../types";
import {
  EthProviderError,
  getLocalFallbackContentHash
} from "../../modules/ethClient";

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

  const clientData = ethClientData[target];
  if (!clientData) throw Error(`No client data for target: ${target}`);
  const { name, version, userSettings } = clientData;
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
        // NOTE: This status has to be verified on DAPPMANAGER startup. Otherwise it can
        // stay in installing state forever if the dappmanager resets during the installation
        return null;

      case "TO_INSTALL":
      case "INSTALLING_ERROR":
        // OK: Expected state, run / retry installation

        try {
          db.ethClientInstallStatus.set(target, { status: "INSTALLING" });

          const installOptions = {
            name,
            version,
            userSettings: {
              [name]: merge(
                // Merge the default user settings with any customization from the user
                userSettings || {},
                db.ethClientUserSettings.get(target) || {}
              )
            }
          };

          try {
            await packageInstall(installOptions);
          } catch (e) {
            // When installing DAppNode for the first time, if the user selects a
            // non-remote target and disabled fallback, there must be a way to
            // install the client package without access to an Eth node. This try / catch
            // covers this case by re-trying the installation with a locally available
            // IPFS content hash for all target packages
            if (e instanceof EthProviderError) {
              const contentHash = getLocalFallbackContentHash(name);
              if (!contentHash) throw Error(`No local version for ${name}`);
              await packageInstall({ ...installOptions, version: contentHash });
            } else {
              throw e;
            }
          }

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
 * Reset status if == INSTALLING, it has to be verified
 * Otherwise it can stay in installing state forever if the dappmanager
 * resets during an installation of the client
 */
function verifyInitialStatusIsNotInstalling() {
  const target = db.ethClientTarget.get();
  if (target) {
    const status = db.ethClientInstallStatus.get(target);
    if (status && status.status === "INSTALLING") {
      db.ethClientInstallStatus.set(target, { status: "TO_INSTALL" });
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
  verifyInitialStatusIsNotInstalling();

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
        logs.error("Error on eth client installer watcher", e);
      }
    })
  );

  setInterval(eventBus.runEthClientInstaller.emit, 1 * 60 * 1000);
}
