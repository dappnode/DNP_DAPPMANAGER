import { MY_PACKAGES } from "./params.js";
import * as db from "@dappnode/db";

/**
 * Check if auto updates are enabled for a specific DNP
 * @param dnpName optional
 * @returns isEnabled
 */
export function isDnpUpdateEnabled(dnpName = MY_PACKAGES): boolean {
  const settings = db.autoUpdateSettings.get();

  // If checking the general MY_PACKAGES setting,
  // or a DNP that does not has a specific setting,
  // use the general MY_PACKAGES setting
  if (!settings[dnpName]) dnpName = MY_PACKAGES;
  return (settings[dnpName] || {}).enabled ? true : false;
}
