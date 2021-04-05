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
export function copyHostService(serviceName: string): void {
  // Paths
  const pathNew = path.join(hostServicesDirSource, serviceName);
  const pathOld = path.join(hostServicesDir, serviceName);

  // Make sure the target services dir exists
  fs.mkdirSync(hostServicesDir, { recursive: true });

  // Check if service already exists
  if (sha256File(pathNew) === sha256File(pathOld)) {
    logs.info(`hostService ${serviceName} already copied`);
    return;
  }

  // Copy service in shared folder
  fs.copyFileSync(pathNew, pathOld);

  logs.info(`Successfully copied hostService: ${serviceName}`);
}
