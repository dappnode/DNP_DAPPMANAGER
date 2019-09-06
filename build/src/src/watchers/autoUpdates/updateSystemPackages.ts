import { eventBus, eventBusTag } from "../../eventBus";
import fetchCoreUpdateData from "../../calls/fetchCoreUpdateData";
// Utils
import {
  isUpdateDelayCompleted,
  flagCompletedUpdate,
  flagErrorUpdate
} from "../../utils/autoUpdateHelper";
// External calls
import installPackage from "../../calls/installPackage";
import Logs from "../../logs";
const logs = Logs(module);

const coreDnpName = "core.dnp.dappnode.eth";

export default async function updateSystemPackages(): Promise<void> {
  const {
    result: { available, type, versionId }
  } = await fetchCoreUpdateData({});

  // If there is not update available or the type is not patch, return early
  if (!available || type !== "patch") return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!isUpdateDelayCompleted(coreDnpName, versionId)) return;

  logs.info(`Auto-updating system packages...`);

  try {
    await installPackage({
      id: coreDnpName,
      options: { BYPASS_RESOLVER: true }
    });

    /**
     * If the DAPPMANAGER is updated the updateRegistry will never be executed.
     * Add it preventively, and then remove it if the update errors
     */
    flagCompletedUpdate(coreDnpName, versionId);
    logs.info(`Successfully auto-updated system packages`);
    eventBus.emit(eventBusTag.emitPackages);
  } catch (e) {
    flagErrorUpdate(coreDnpName, e.message);
    throw e;
  }
}
