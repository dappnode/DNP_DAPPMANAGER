import fs from "fs";
import path from "path";
import * as db from "@dappnode/db";
import { tempTransferDir } from "../uploads/tempTransfer.js";

/** IDs created by createFileTransferId */
const FILE_ID = /^[0-9a-f]{64}$/;

/**
 * Delete a backup uploaded to restore it, when the admin does not want to
 * restore it. An upload is kept so a mistyped password can be retried
 * without uploading it again, and is otherwise deleted after 30 minutes
 */
export async function fullBackupUploadDiscard({ fileId }: { fileId: string }): Promise<void> {
  if (typeof fileId !== "string" || !FILE_ID.test(fileId)) throw Error("Invalid file id");
  const filePath = db.fileTransferPath.get(fileId);
  // Already deleted, expired or consumed by a restore
  if (!filePath) return;
  // Only uploads: never the download of a backup created on this node
  if (path.dirname(path.resolve(filePath)) !== path.resolve(tempTransferDir)) throw Error("Not an uploaded file");
  db.fileTransferPath.remove(fileId);
  fs.rmSync(filePath, { force: true });
}
