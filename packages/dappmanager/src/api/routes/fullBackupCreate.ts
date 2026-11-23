import { wrapHandler } from "../utils.js";
import { createFullBackup } from "../../fullBackup/create.js";

/**
 * POST /full-backup { adminPassword, password }
 *
 * Mounted behind auth.onlyAdminWithPasswordConfirmation, which checks
 * `adminPassword`: the backup contains every secret on this DAppNode.
 * `password` encrypts the file and is never stored. Responds with
 * FullBackupCreateResult, whose fileId is used with /download/:fileId
 */
export const fullBackupCreate = wrapHandler(async (req, res) => {
  try {
    res.send(await createFullBackup({ password: req.body?.password }));
  } catch (e) {
    res.status(400).send({ error: { message: e.message } });
  }
});
