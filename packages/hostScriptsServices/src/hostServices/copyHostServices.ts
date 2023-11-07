import { params } from "@dappnode/params";
import { copyOnHost } from "../copyOnHost.js";

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
  await copyOnHost({
    hostDir: hostServicesDir,
    hostDirSource: hostServicesDirSource,
  });
}
