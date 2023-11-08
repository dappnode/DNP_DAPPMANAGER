import path from "path";
import fs from "fs";
import { params } from "@dappnode/params";
import { shellHost } from "@dappnode/utils";
import { reloadServices } from "./reloadServices.js";
import { copyHostService } from "./copyHostService.js";

/**
 * Service runners. Helps ensure no typos
 */
type ServiceName = "update-upgrade-host.service";

/**
 * Run a service for the hostService folder
 * @param serviceName "update-docker-engine.service"
 * sytemd service info: https://www.freedesktop.org/software/systemd/man/systemd.service.html
 */
export async function runService(
  serviceName: ServiceName,
  reload: boolean,
  args = ""
): Promise<string> {
  const servicePath = path.resolve(
    params.HOST_SERVICES_SOURCE_DIR,
    serviceName
  );
  try {
    // Check if service exists
    if (!fs.existsSync(servicePath))
      throw Error(`Host service ${serviceName} not found`);

    // Copy service into shared volume
    await copyHostService(serviceName);

    // Reload services if necessary
    if (reload) await reloadServices();

    // Run service
    return await shellHost(`systemctl start ${serviceName} ${args}`);
  } catch (e) {
    e.message = `Error running service ${serviceName}: ${e.message}`;
    throw e;
  }
}
