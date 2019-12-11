import fs from "fs";
import path from "path";
import crypto from "crypto";
import params from "../../params";

const hostScriptsDir = params.HOST_SCRIPTS_DIR;
const hostScriptsDirSource = params.HOST_SCRIPTS_SOURCE_DIR;

/**
 * Copies the scripts to the host shared folder
 * - Add new scripts
 * - Update scripts by comparing sha256 hashes
 * - Remove scripts that are not here
 */
export function copyHostScripts(): void {
  // Make sure the target scripts dir exists
  fs.mkdirSync(hostScriptsDir, { recursive: true });

  // Fetch list of scripts to diff them
  const newScripts = fs.readdirSync(hostScriptsDirSource);
  const oldScripts = fs.readdirSync(hostScriptsDir);

  // Compute files to remove
  for (const nameOld of oldScripts)
    if (!newScripts.includes(nameOld))
      fs.unlinkSync(path.join(hostScriptsDir, nameOld));

  // Compute files to add
  for (const name of newScripts) {
    const pathNew = path.join(__dirname, name);
    const pathOld = path.join(hostScriptsDir, name);
    if (sha256File(pathNew) !== sha256File(pathOld))
      fs.copyFileSync(pathNew, pathOld);
  }
}

/**
 * Computes the sha256 of a file's contents
 * [NOTE]: If the path is not existent, return empty string ""
 * @param filePath
 */
export function sha256File(filePath: string): string {
  const hash = crypto.createHash("sha256");
  if (!fs.existsSync(filePath)) return "";
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}
