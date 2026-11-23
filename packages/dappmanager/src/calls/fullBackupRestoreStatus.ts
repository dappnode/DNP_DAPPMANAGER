import { FullBackupRestoreStatus } from "@dappnode/types";
import { getRestoreStatus } from "../fullBackup/restore.js";

/** Status of the current or last full backup restore */
export async function fullBackupRestoreStatus(): Promise<FullBackupRestoreStatus> {
  return getRestoreStatus();
}
