import { wrapHandlerHtml } from "../utils.js";
import { getPendingBackupPath } from "../../fullBackup/pending.js";

interface Params {
  fileName: string;
}

/**
 * GET /full-backup/pending/:fileName
 *
 * Downloads a backup kept on this node because it removed validator keys
 * from it. Unlike /download/:fileId it works any number of times and never
 * deletes the file: the admin discards it with fullBackupPendingDiscard
 */
export const fullBackupPendingDownload = wrapHandlerHtml<Params>((req, res) => {
  let filePath: string;
  try {
    filePath = getPendingBackupPath(req.params.fileName);
  } catch (e) {
    return res.status(404).send(e.message);
  }
  return res.download(filePath);
});
