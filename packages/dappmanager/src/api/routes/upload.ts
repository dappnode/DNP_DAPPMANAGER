import fs from "fs";
import path from "path";
import crypto from "crypto";
import params from "../../params.js";
import * as db from "../../db/index.js";
import { logs } from "../../logs.js";
import { wrapHandler } from "../utils.js";

const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Endpoint to upload files.
 * Any file type and size will be accepted
 * A fileId will be provided afterwards to be used in another useful call
 */
export const upload = wrapHandler(async (req, res) => {
  if (!req.files || typeof req.files !== "object")
    return res.status(400).send("Argument files missing");
  if (Object.keys(req.files).length == 0)
    return res.status(400).send("No files were uploaded.");

  const fileId = crypto.randomBytes(32).toString("hex");
  const filePath = path.join(tempTransferDir, fileId);

  // Use the mv() method to place the file somewhere on your server
  // The name of the input field (i.e. "file") is used to retrieve the uploaded file
  const file = Array.isArray(req.files.file)
    ? req.files.file[0]
    : req.files.file;
  file.mv(filePath, err => {
    if (err) return res.status(500).send(err);

    db.fileTransferPath.set(fileId, filePath);
    res.send(fileId);
    // Delete the file after 15 minutes
    setTimeout(() => {
      fs.unlink(filePath, errFs => {
        if (errFs) logs.error(`Error deleting file: ${errFs.message}`);
      });
    }, 15 * 60 * 1000);
  });
});
