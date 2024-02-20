import path from "path";
import { params } from "@dappnode/params";
import { shellHost } from "@dappnode/utils";

const hostSystemdDir = params.HOST_SYSTEMD_DIR_FROM_HOST;
const hostServicesDir = params.HOST_SERVICES_DIR_FROM_HOST;

/**
 * Copies the service to the default host path for services:
 * /etc/systemd/system
 */
export async function copyHostService(serviceName: string): Promise<void> {
  const serviceSourcePath = path.join(hostServicesDir, serviceName);
  const serviceDestPath = path.join(hostSystemdDir, serviceName);

  // --update: copy only when the SOURCE file is newer than the destination file
  // or when the destination file is missing
  await shellHost(`cp -- --update ${serviceSourcePath} ${serviceDestPath}`);
}
