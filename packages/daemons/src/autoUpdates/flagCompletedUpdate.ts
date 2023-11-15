import { AutoUpdateRegistryEntry } from "@dappnode/common";
import { eventBus } from "@dappnode/eventbus";
import * as db from "@dappnode/db";
import { omit } from "lodash-es";

/**
 * Flags a DNP version as successfully auto-updated
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.5"
 * @param timestamp Use ONLY to make tests deterministic
 */
export function flagCompletedUpdate(
  dnpName: string,
  version: string,
  timestamp?: number
): void {
  setRegistry(dnpName, version, {
    updated: timestamp || Date.now(),
    successful: true
  });

  clearPendingUpdatesOfDnp(dnpName);
}

/**
 * Set a DNP version entry in the registry by merging data
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.5"
 * @param data { param: "value" }
 */
function setRegistry(
  dnpName: string,
  version: string,
  data: AutoUpdateRegistryEntry
): void {
  const registry = db.autoUpdateRegistry.get();

  db.autoUpdateRegistry.set({
    ...registry,
    [dnpName]: {
      ...(registry[dnpName] || {}),
      [version]: {
        ...((registry[dnpName] || {})[version] || {}),
        ...data
      }
    }
  });

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
