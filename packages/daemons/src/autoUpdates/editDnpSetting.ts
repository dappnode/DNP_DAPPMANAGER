import * as db from "@dappnode/db";
import { pick } from "lodash-es";
import { MY_PACKAGES, SYSTEM_PACKAGES } from "./params.js";
import { clearPendingUpdates } from "./clearPendingUpdates.js";
import { setSettings } from "./setSettings.js";

/**
 * Edit the settings of regular DNPs
 * - pass the `name` argument to edit a specific DNP
 * - set `name` to null to edit the general My packages setting
 *
 * @param enabled
 * @param dnpName, if null modifies MY_PACKAGES settings
 */
export function editDnpSetting(enabled: boolean, dnpName = MY_PACKAGES): void {
  const autoUpdateSettings = db.autoUpdateSettings.get();

  // When disabling MY_PACKAGES, turn off all DNPs settings by
  // Ignoring all entries but the system packages
  if (dnpName === MY_PACKAGES && !enabled)
    db.autoUpdateSettings.set(pick(autoUpdateSettings, SYSTEM_PACKAGES));

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) clearPendingUpdates(dnpName);

  setSettings(dnpName, enabled);
}
