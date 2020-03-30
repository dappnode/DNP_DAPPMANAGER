import * as db from "../../db";
import * as eventBus from "../../eventBus";
import { removePackage } from "../../calls";
import { EthClientTarget, UserSettings } from "../../types";
import { getClientData } from "./clientParams";
import Logs from "../../logs";
import { getTarget, setTarget, setStatus } from "./utils";
const logs = Logs(module);

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
  const prevTarget = getTarget();
  if (prevTarget === nextTarget) throw Error("Same target");

  // Set user settings of next target if any
  if (userSettings) db.ethClientUserSettings.set(nextTarget, userSettings);

  // If the previous client is a client package, uninstall it
  if (prevTarget && prevTarget !== "remote") {
    try {
      const { name } = getClientData(prevTarget);
      await removePackage({ id: name, deleteVolumes });
      // Must await uninstall because geth -> light, light -> geth
      // will create conflicts otherwise
    } catch (e) {
      logs.error(`Error removing previous ETH multi-client: ${e.stack}`);
    }
  }

  // Setting the status to selected will trigger an install
  setTarget(nextTarget);
  setStatus("selected");
  eventBus.runEthMultiClientWatcher.emit();
}
