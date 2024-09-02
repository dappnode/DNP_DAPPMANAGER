import fs from "fs";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { wrapHandlerHtml } from "../utils.js";

interface Params {
  fileId: string;
}

/**
 * Endpoint to download files.
 * File must be previously available at the specified fileId
 */
export const download = wrapHandlerHtml<Params>((req, res) => {
  const { fileId } = req.params;
  const filePath = db.fileTransferPath.get(fileId);

  // If path does not exist, return error
  if (!filePath) return res.status(404).send("File not found");

  // Remove the fileId from the DB FIRST to prevent reply attacks
  db.fileTransferPath.remove(fileId);
  return res.download(filePath, (errHttp) => {
    if (!errHttp)
      fs.unlink(filePath, (errFs) => {
        if (errFs) logs.error(`Error deleting file: ${errFs.message}`);
      });
  });
});
