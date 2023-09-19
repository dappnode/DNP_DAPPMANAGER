import fs from "fs";
import path from "path";
import { params } from "@dappnode/params";
import { logs } from "../../logs.js";
import { sha256File } from "../hostScripts/index.js";

const hostServicesDir = params.HOST_SERVICES_DIR;
const hostServicesDirSource = params.HOST_SERVICES_SOURCE_DIR;

/**
 * Copies the Services to the host shared folder
 * - Add new Services
 * - Update Services by comparing sha256 hashes
 * - Remove Services that are not here
 * @returns For info and logging
 */
export async function copyHostServices(): Promise<void> {
  // Make sure the target Services dir exists
  fs.mkdirSync(hostServicesDir, { recursive: true });

  // Fetch list of Services to diff them
  const newServices = fs.readdirSync(hostServicesDirSource);
  const oldServices = fs.readdirSync(hostServicesDir);
  const removed: string[] = [];
  const copied: string[] = [];

  // Compute files to remove
  for (const name of oldServices)
    if (!newServices.includes(name)) {
      fs.unlinkSync(path.join(hostServicesDir, name));
      removed.push(name);
    }

  // Compute files to add
  for (const name of newServices) {
    const pathNew = path.join(hostServicesDirSource, name);
    const pathOld = path.join(hostServicesDir, name);
    if (sha256File(pathNew) !== sha256File(pathOld)) {
      fs.copyFileSync(pathNew, pathOld);
      copied.push(name);
    }
  }

  let message = "Successfully run copyHostServices.";
  if (copied.length) message += ` Copied ${copied.join(", ")}.`;
  if (removed.length) message += ` Removed ${removed.join(", ")}.`;
  logs.info(message);
}
