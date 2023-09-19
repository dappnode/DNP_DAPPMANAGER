import { eventBus } from "../../eventBus.js";
import { params } from "@dappnode/params";
import {
  isUpdateDelayCompleted,
  flagCompletedUpdate,
  flagErrorUpdate,
  isCoreUpdateEnabled
} from "../../utils/autoUpdateHelper.js";
import { packageInstall } from "../../calls/index.js";
import { logs } from "../../logs.js";
import { getCoreUpdateData } from "../../calls/fetchCoreUpdateData.js";
import { CoreUpdateDataAvailable } from "@dappnode/common";
import { sendUpdateSystemNotificationMaybe } from "./sendUpdateNotification.js";

const coreDnpName = params.coreDnpName;

/**
 * Fetch core update data, check its version and if there is an update available
 * - Send notification if this specific DNP_CORE version has not been seen
 * - Auto-update system according if DNP_CORE or any dependency is not updated
 */
export async function checkSystemPackagesVersion(): Promise<void> {
  const coreUpdateData = await getCoreUpdateData();

  if (!coreUpdateData.available) return;

  sendUpdateSystemNotificationMaybe(coreUpdateData);

  await autoUpdateSystemPackages(coreUpdateData);
}

export async function autoUpdateSystemPackages({
  type,
  versionId
}: CoreUpdateDataAvailable): Promise<void> {
  if (!isCoreUpdateEnabled()) return;

  // If there is not update available or the type is not patch, return early
  if (type !== "patch") return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!isUpdateDelayCompleted(coreDnpName, versionId)) return;

  logs.info(`Auto-updating system packages...`);

  try {
    await packageInstall({
      name: coreDnpName,
      options: { BYPASS_RESOLVER: true }
    });

    /**
     * If the DAPPMANAGER is updated the updateRegistry will never be executed.
     * Add it preventively, and then remove it if the update errors
     */
    flagCompletedUpdate(coreDnpName, versionId);
    logs.info(`Successfully auto-updated system packages`);
    eventBus.requestPackages.emit();
  } catch (e) {
    flagErrorUpdate(coreDnpName, e.message);
    throw e;
  }
}
