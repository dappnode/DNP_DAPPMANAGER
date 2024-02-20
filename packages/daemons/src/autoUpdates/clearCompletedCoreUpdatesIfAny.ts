import { params } from "@dappnode/params";
import { flagCompletedUpdate } from "./flagCompletedUpdate.js";
import * as db from "@dappnode/db";
import { isVersionIdUpdated } from "@dappnode/utils";

/**
 * If the DAPPMANAGER is updated the pending state will never be updated to
 * "completed". So on every DAPPMANAGER start it must checked if a successful
 * update happen before restarting
 *
 * @param currentCorePackages To get the current version of installed packages
 * If stored pending coreVersionId contains versions higher than this, it will
 * be marked as done
 * @param timestamp Use ONLY to make tests deterministic
 */
export function clearCompletedCoreUpdatesIfAny(
  currentCorePackages: { dnpName: string; version: string }[],
  timestamp?: number
): void {
  const pending = db.autoUpdatePending.get();

  const { version: pendingVersionId } = pending[params.coreDnpName] || {};
  const pendingVersionsAreInstalled =
    pendingVersionId &&
    isVersionIdUpdated(pendingVersionId, currentCorePackages);

  if (pendingVersionsAreInstalled && pendingVersionId) {
    flagCompletedUpdate(params.coreDnpName, pendingVersionId, timestamp);
  }
}
