import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";

/**
 * Set the current
 * Abstracts the lengthy object merging to simply the other functions
 *
 * @param id "bitcoin.dnp.dappnode.eth"
 * @param enabled true
 */
export function setSettings(id: string, enabled: boolean): void {
  const autoUpdateSettings = db.autoUpdateSettings.get();

  db.autoUpdateSettings.set({
    ...autoUpdateSettings,
    [id]: { enabled }
  });

  eventBus.requestAutoUpdateData.emit();
}
