import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { ethClientData } from "../../params";
import { packageRemove } from "../../calls";
import { EthClientTarget, UserSettings } from "../../types";
import { logs } from "../../logs";

/**
 * Changes the ethereum client used to fetch package data
 * Callable by the client
 * @param nextTarget Ethereum client to change to
 * @param deleteVolumes If changing from a package client, delete its data
 */
export async function changeEthMultiClient(
  nextTarget: EthClientTarget,
  deleteVolumes?: boolean,
  userSettings?: UserSettings
): Promise<void> {
  const prevTarget = db.ethClientTarget.get();

  // Set user settings of next target if any
  if (userSettings) db.ethClientUserSettings.set(nextTarget, userSettings);

  // If the previous client is a client package, uninstall it
  if (prevTarget !== nextTarget && prevTarget && prevTarget !== "remote") {
    try {
      const clientData = ethClientData[prevTarget];
      if (clientData) {
        db.ethClientInstallStatus.set(prevTarget, { status: "UNINSTALLED" });
        await packageRemove({ dnpName: clientData.dnpName, deleteVolumes });
        // Must await uninstall because geth -> light, light -> geth
        // will create conflicts since it's the same DNP
      }
    } catch (e) {
      logs.error("Error removing previous ETH multi-client", e);
    }
  }

  // Setting the status to selected will trigger an install
  db.ethClientTarget.set(nextTarget);
  if (prevTarget !== nextTarget && nextTarget !== "remote") {
    db.ethClientInstallStatus.set(nextTarget, { status: "TO_INSTALL" });
    eventBus.runEthClientInstaller.emit();
  }
}
