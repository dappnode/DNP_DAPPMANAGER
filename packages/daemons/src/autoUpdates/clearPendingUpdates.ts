import * as db from "@dappnode/db";
import { MY_PACKAGES, SYSTEM_PACKAGES } from "./params.js";
import { params } from "@dappnode/params";
import { eventBus } from "@dappnode/eventbus";
import { omit } from "lodash-es";

/**
 * Clears the pending updates from the registry
 * from a setting ID.
 *
 * @param dnpName "my-packages", "system-packages", "bitcoin.dnp.dappnode.eth"
 */
export function clearPendingUpdates(dnpName: string): void {
  const pending = db.autoUpdatePending.get();

  if (dnpName === MY_PACKAGES) {
    const dnpNames = Object.keys(pending).filter(
      dnpName => dnpName !== params.coreDnpName
    );
    for (const dnpName of dnpNames) {
      clearPendingUpdatesOfDnp(dnpName);
    }
  } else if (dnpName === SYSTEM_PACKAGES) {
    clearPendingUpdatesOfDnp(params.coreDnpName);
  } else {
    clearPendingUpdatesOfDnp(dnpName);
  }

  eventBus.requestAutoUpdateData.emit();
}

/**
 * Clears the pending updates from the registry so:
 * - The update delay time is reseted
 * - The UI does no longer show the "Scheduled" info
 *
 * @param dnpName "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
function clearPendingUpdatesOfDnp(dnpName: string): void {
  const pending = db.autoUpdatePending.get();
  db.autoUpdatePending.set(omit(pending, dnpName));
}
