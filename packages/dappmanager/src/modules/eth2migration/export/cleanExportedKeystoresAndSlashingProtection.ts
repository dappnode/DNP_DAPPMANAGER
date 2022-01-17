import { logs } from "../../../logs";
import fs from "fs";
import { dappmanagerOutPaths } from "./params";

/**
 * Removes eth2migration files from the dappmanager volume
 */
export function cleanExportedKeystoresAndSlashingProtection(): void {
  for (const filepath of [
    dappmanagerOutPaths.walletpasswordOutFilepath,
    dappmanagerOutPaths.backupOutFilepath,
    dappmanagerOutPaths.slashingProtectionOutFilepath
  ]) {
    try {
      fs.unlinkSync(filepath);
    } catch (e) {
      if (e.code !== "ENOENT") {
        logs.error(`Error cleaning Prysm migration file ${filepath}`, e);
      }
    }
  }

  try {
    fs.rmdirSync(dappmanagerOutPaths.keystoresOutDir, { recursive: true });
  } catch (e) {
    if (e.code !== "ENOENT") {
      logs.error("Error cleaning Prysm migration keystores dir", e);
    }
  }
}
