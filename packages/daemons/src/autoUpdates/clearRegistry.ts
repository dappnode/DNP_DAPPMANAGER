import { eventBus } from "@dappnode/eventbus";
import { omit } from "lodash-es";
import * as db from "@dappnode/db";

/**
 * Clears the auto-update registry entries.
 * Should be used when uninstalling a DNP, for clearing the UI
 * and the install history of the DNP.
 *
 * @param dnpName "core.dnp.dappnode.eth", "bitcoin.dnp.dappnode.eth"
 */
export function clearRegistry(dnpName: string): void {
  const registry = db.autoUpdateRegistry.get();
  db.autoUpdateRegistry.set(omit(registry, dnpName));

  eventBus.requestAutoUpdateData.emit();
}
