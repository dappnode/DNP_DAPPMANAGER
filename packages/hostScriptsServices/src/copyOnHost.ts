import fs from "fs";
import crypto from "crypto";
import path from "path";
import { logs } from "@dappnode/logger";

/**
 * Copies the files to the host shared folder
 * - Add new files
 * - Update files by comparing sha256 hashes
 * - Remove files that are not here
 * @returns For info and logging
 */
export async function copyOnHost({
  hostDir,
  hostDirSource,
}: {
  hostDir: string;
  hostDirSource: string;
}): Promise<void> {
  // Make sure the target scripts dir exists
  fs.mkdirSync(hostDir, { recursive: true });

  // Fetch list of scripts to diff them
  const newScripts = fs.readdirSync(hostDirSource);
  const oldScripts = fs.readdirSync(hostDir);
  const removed: string[] = [];
  const copied: string[] = [];

  // Compute files to remove
  for (const name of oldScripts)
    if (!newScripts.includes(name)) {
      fs.unlinkSync(path.join(hostDir, name));
      removed.push(name);
    }

  // Compute files to add
  for (const name of newScripts) {
    const pathNew = path.join(hostDirSource, name);
    const pathOld = path.join(hostDir, name);
    if (sha256File(pathNew) !== sha256File(pathOld)) {
      fs.copyFileSync(pathNew, pathOld);
      copied.push(name);
    }
  }

  let message = "Successfully run copyHost.";
  if (copied.length) message += ` Copied ${copied.join(", ")}.`;
  if (removed.length) message += ` Removed ${removed.join(", ")}.`;
  logs.info(message);
}

/**
 * Computes the sha256 of a file's contents
 * [NOTE]: If the path is not existent, return empty string ""
 * @param filePath
 */
function sha256File(filePath: string): string {
  const hash = crypto.createHash("sha256");
  if (!fs.existsSync(filePath)) return "";
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}
