import fs from "fs";
import path from "path";
import crypto from "crypto";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { wrapHandler } from "../utils.js";

const tempTransferDir = params.TEMP_TRANSFER_DIR;
const UPLOAD_TTL_MS = 15 * 60 * 1000;

/**
 * Ensure the temp transfer directory exists before writing files.
 */
function ensureTempTransferDir(): void {
  if (!fs.existsSync(tempTransferDir)) {
    fs.mkdirSync(tempTransferDir, { recursive: true });
  }
}

/**
 * Schedule cleanup of an uploaded file. Removes the mapping from dbCache
 * and deletes the underlying file, swallowing errors so cleanup does not
 * crash the request.
 */
function scheduleFileCleanup(fileId: string, filePath: string): void {
  setTimeout(() => {
    db.fileTransferPath.remove(fileId);
    fs.unlink(filePath, (errFs) => {
      if (errFs && errFs.code !== "ENOENT") {
        logs.error(`Error deleting uploaded file ${filePath}: ${errFs.message}`);
      }
    });
  }, UPLOAD_TTL_MS);
}

/**
 * Endpoint to upload files.
 * Any file type and size will be accepted
 * A fileId will be provided afterwards to be used in another useful call
 */
export const upload = wrapHandler(async (req, res) => {
  if (!req.files || typeof req.files !== "object") return res.status(400).send("Argument files missing");
  if (Object.keys(req.files).length == 0) return res.status(400).send("No files were uploaded.");

  const fileId = crypto.randomBytes(32).toString("hex");
  ensureTempTransferDir();
  const filePath = path.join(tempTransferDir, fileId);

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

  db.fileTransferPath.set(fileId, filePath);
  scheduleFileCleanup(fileId, filePath);
  res.send(fileId);
  return;
});
