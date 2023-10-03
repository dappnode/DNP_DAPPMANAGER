import fs from "fs";
import path from "path";
import crypto from "crypto";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";

const hostScriptsDir = params.HOST_SCRIPTS_DIR;
const hostScriptsDirSource = params.HOST_SCRIPTS_SOURCE_DIR;

/**
 * Copies the scripts to the host shared folder
 * - Add new scripts
 * - Update scripts by comparing sha256 hashes
 * - Remove scripts that are not here
 * @returns For info and logging
 */
export async function copyHostScripts(): Promise<void> {
  // Make sure the target scripts dir exists
  fs.mkdirSync(hostScriptsDir, { recursive: true });

  // Fetch list of scripts to diff them
  const newScripts = fs.readdirSync(hostScriptsDirSource);
  const oldScripts = fs.readdirSync(hostScriptsDir);
  const removed: string[] = [];
  const copied: string[] = [];

  // Compute files to remove
  for (const name of oldScripts)
    if (!newScripts.includes(name)) {
      fs.unlinkSync(path.join(hostScriptsDir, name));
      removed.push(name);
    }

  // Compute files to add
  for (const name of newScripts) {
    const pathNew = path.join(hostScriptsDirSource, name);
    const pathOld = path.join(hostScriptsDir, name);
    if (sha256File(pathNew) !== sha256File(pathOld)) {
      fs.copyFileSync(pathNew, pathOld);
      copied.push(name);
    }
  }

  let message = "Successfully run copyHostScripts.";
  if (copied.length) message += ` Copied ${copied.join(", ")}.`;
  if (removed.length) message += ` Removed ${removed.join(", ")}.`;
  logs.info(message);
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
