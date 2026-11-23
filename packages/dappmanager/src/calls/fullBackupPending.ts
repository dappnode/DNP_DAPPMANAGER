import { FullBackupPendingBackup } from "@dappnode/types";
import { discardPendingBackup, listPendingBackups } from "../fullBackup/pending.js";

/**
 * Backups kept on this node because they removed validator keys from it,
 * newest first. Download one with GET /full-backup/pending/:fileName
 */
export async function fullBackupPendingGet(): Promise<FullBackupPendingBackup[]> {
  return listPendingBackups();
}

/** Delete the copy of a backup kept on this node, once the admin has the file */
export async function fullBackupPendingDiscard({ fileName }: { fileName: string }): Promise<void> {
  discardPendingBackup(fileName);
}
