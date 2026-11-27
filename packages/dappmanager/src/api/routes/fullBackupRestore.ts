import fs from "fs";
import * as db from "@dappnode/db";
import { listPackages } from "@dappnode/dockerapi";
import { wrapHandler } from "../utils.js";
import { readBackupManifest } from "../../fullBackup/read.js";
import { inspectBackup } from "../../fullBackup/plan.js";
import { startRestore } from "../../fullBackup/restore.js";
import { restoreDeps } from "../../fullBackup/restoreDeps.js";
import { getVersionData } from "../../utils/getVersionData.js";

function uploadedFilePath(fileId: unknown): string {
  if (typeof fileId !== "string") throw Error("Argument fileId is required");
  const filePath = db.fileTransferPath.get(fileId);
  if (!filePath || !fs.existsSync(filePath)) throw Error("Uploaded backup not found, upload it again");
  return filePath;
}

/**
 * POST /full-backup/inspect { fileId, password }
 *
 * Decrypts only the manifest of an uploaded backup and returns what a merge
 * or clone restore would do on this node. Changes nothing.
 */
export const fullBackupInspect = wrapHandler(async (req, res) => {
  try {
    const { fileId, password } = req.body ?? {};
    if (typeof password !== "string") throw Error("Backup password is required");
    const manifest = await readBackupManifest(uploadedFilePath(fileId), password);
    const installed = (await listPackages()).map((p) => ({ dnpName: p.dnpName, version: p.version, isCore: p.isCore }));
    res.send(
      inspectBackup({ manifest, installed, dappmanagerVersion: getVersionData().data.version, arch: process.arch })
    );
  } catch (e) {
    res.status(400).send({ error: { message: e.message } });
  }
});

/**
 * POST /full-backup/restore { adminPassword, fileId, password, mode, restoreDataFor?, confirmValidatorsOff }
 *
 * Mounted behind auth.onlyAdminWithPasswordConfirmation. Verifies the whole
 * file, then starts the restore in the background: follow it with the
 * fullBackupRestoreStatus RPC
 */
export const fullBackupRestore = wrapHandler(async (req, res) => {
  try {
    const { fileId, password, mode, restoreDataFor, confirmValidatorsOff } = req.body ?? {};
    if (typeof password !== "string") throw Error("Backup password is required");
    const filePath = uploadedFilePath(fileId);
    const inspected = inspectBackup({
      manifest: await readBackupManifest(filePath, password),
      installed: [],
      dappmanagerVersion: getVersionData().data.version,
      arch: process.arch
    });
    if (inspected.blockers.length > 0) throw Error(inspected.blockers.join(" "));

    await startRestore({
      filePath,
      password,
      mode,
      restoreDataFor,
      confirmValidatorsOff: confirmValidatorsOff === true,
      deps: restoreDeps
    });
    // The content is extracted: the uploaded file is no longer needed
    db.fileTransferPath.remove(fileId);
    fs.rmSync(filePath, { force: true });
    res.send({ ok: true });
  } catch (e) {
    res.status(400).send({ error: { message: e.message } });
  }
});
