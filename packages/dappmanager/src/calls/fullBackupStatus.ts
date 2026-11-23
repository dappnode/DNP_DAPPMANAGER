import { FullBackupStatus } from "@dappnode/types";
import { getFullBackupStatus } from "../fullBackup/create.js";

/** Whether a full backup is being created, and how the last one ended */
export async function fullBackupStatus(): Promise<FullBackupStatus> {
  return getFullBackupStatus();
}
