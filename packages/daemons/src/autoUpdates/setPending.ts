import { AutoUpdatePendingEntry } from "@dappnode/common";
import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";

/**
 * Set a DNP version entry in the registry by merging data
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param data { version: "0.2.6", param: "value" }
 */
export function setPending(
  dnpName: string,
  data: AutoUpdatePendingEntry
): void {
  const pending = db.autoUpdatePending.get();
  db.autoUpdatePending.set({
    ...pending,
    [dnpName]: {
      ...(pending[dnpName] || {}),
      ...data
    }
  });

  eventBus.requestAutoUpdateData.emit();
}
