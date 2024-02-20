import * as db from "@dappnode/db";
import { SYSTEM_PACKAGES } from "./params.js";

/**
 * Check if auto updates are enabled for system packages
 * @returns isEnabled
 */
export function isCoreUpdateEnabled(): boolean {
  const settings = db.autoUpdateSettings.get();
  return (settings[SYSTEM_PACKAGES] || {}).enabled ? true : false;
}
