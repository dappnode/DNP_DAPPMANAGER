import fs from "fs";
import path from "path";
import params from "../../params";
import { logs } from "../../logs";
import { sha256File } from "../hostScripts";

const hostServicesDir = params.HOST_SERVICES_DIR;
const hostServicesDirSource = params.HOST_SERVICES_SOURCE_DIR;

/**
 * Copies the services to the host shared folder
 * - Add new services
 * - Update services by comparing sha256 hashes
 * - Remove services that are not here
 * @returns For info and logging
 */
export async function copyHostServices(): Promise<void> {
  // Make sure the target services dir exists
  fs.mkdirSync(hostServicesDir, { recursive: true });

  // Fetch list of services to diff them
  const newServices = fs.readdirSync(hostServicesDirSource);
  const copied: string[] = [];

  // Compute files to add
  for (const name of newServices) {
    const pathNew = path.join(hostServicesDirSource, name);
    const pathOld = path.join(hostServicesDir, name);
    if (sha256File(pathNew) !== sha256File(pathOld)) {
      fs.copyFileSync(pathNew, pathOld);
      copied.push(name);
    }
  }

  // Reload services: Only necessary if there are any service "enabled" (systemctl enable service)
  // await shellHost("systemctl daemon-reload")

  let message = "Successfully run copyHostScripts.";
  if (copied.length) message += ` Copied ${copied.join(", ")}.`;
  logs.info(message);
}
