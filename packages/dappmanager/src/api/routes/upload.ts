import { logs } from "@dappnode/logger";
import { wrapHandler } from "../utils.js";
import {
  createFileTransferId,
  ensureTempTransferDir,
  getTempTransferPath,
  registerTempTransferFile
} from "../../uploads/tempTransfer.js";

/**
 * Endpoint to upload files.
 * Any file type and size will be accepted
 * A fileId will be provided afterwards to be used in another useful call
 */
export const upload = wrapHandler(async (req, res) => {
  if (!req.files || typeof req.files !== "object") return res.status(400).send("Argument files missing");
  if (Object.keys(req.files).length == 0) return res.status(400).send("No files were uploaded.");

  const fileId = createFileTransferId();
  ensureTempTransferDir();
  const filePath = getTempTransferPath(fileId);

  // Use the mv() method to place the file somewhere on your server
  // The name of the input field (i.e. "file") is used to retrieve the uploaded file
  const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
  try {
    await file.mv(filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.error(`Error moving uploaded file to ${filePath}: ${message}`);
    return res.status(500).send(`Failed to store uploaded file: ${message}`);
  }

  registerTempTransferFile(fileId, filePath);
  res.send(fileId);
  return;
});
