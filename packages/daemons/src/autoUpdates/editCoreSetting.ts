import { clearPendingUpdates } from "./clearPendingUpdates.js";
import { SYSTEM_PACKAGES } from "./params.js";
import { setSettings } from "./setSettings.js";

/**
/**
 * Edit the general system packages setting
 *
 * @param enabled
 */
export function editCoreSetting(enabled: boolean): void {
  setSettings(SYSTEM_PACKAGES, enabled);

  // When disabling any DNP, clear their pending updates
  // Ignoring all entries but the system packages
  if (!enabled) clearPendingUpdates(SYSTEM_PACKAGES);
}
