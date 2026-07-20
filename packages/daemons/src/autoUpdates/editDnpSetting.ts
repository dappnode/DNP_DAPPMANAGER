import * as db from "@dappnode/db";
import { omit, pick } from "lodash-es";
import { MY_PACKAGES, SYSTEM_PACKAGES } from "./params.js";
import { params } from "@dappnode/params";
import { eventBus } from "@dappnode/eventbus";
import { clearPendingUpdates } from "./clearPendingUpdates.js";
import { setSettings } from "./setSettings.js";

/**
 * Edit the settings of regular DNPs
 * - pass `dnpName` to edit a specific DNP
 * - omit `dnpName` to edit all package defaults
 *
 * @param enabled
 * @param dnpName modifies MY_PACKAGES by default
 * @param applyToAll when editing MY_PACKAGES, clear package overrides
 */
export function editDnpSetting(enabled: boolean, dnpName = MY_PACKAGES, applyToAll = dnpName === MY_PACKAGES): void {
  const autoUpdateSettings = db.autoUpdateSettings.get();

  if (dnpName === MY_PACKAGES && applyToAll) db.autoUpdateSettings.set(pick(autoUpdateSettings, SYSTEM_PACKAGES));

  // When disabling any DNP, clear their pending updates
  if (!enabled) {
    if (dnpName === MY_PACKAGES && !applyToAll) {
      // Preserve pending updates for packages explicitly enabled despite the
      // default being disabled. Reset only packages that inherit the default.
      for (const pendingDnpName of Object.keys(db.autoUpdatePending.get())) {
        if (pendingDnpName !== params.coreDnpName && !autoUpdateSettings[pendingDnpName]?.enabled)
          clearPendingUpdates(pendingDnpName);
      }
    } else clearPendingUpdates(dnpName);
  }

  const defaultEnabled = Boolean(autoUpdateSettings[MY_PACKAGES]?.enabled);
  if (dnpName !== MY_PACKAGES && enabled === defaultEnabled) {
    // A package set to the default no longer needs a persistent override.
    db.autoUpdateSettings.set(omit(db.autoUpdateSettings.get(), dnpName));
    eventBus.requestAutoUpdateData.emit();
  } else setSettings(dnpName, enabled);
}
