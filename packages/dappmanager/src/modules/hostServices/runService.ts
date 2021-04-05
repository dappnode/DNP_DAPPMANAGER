import path from "path";
import fs from "fs";
import params from "../../params";
import { shellHost } from "../../utils/shell";
import { copyHostService } from "./copyHostService";
import { reloadServices } from "./reloadServices";

/**
 * Service runners. Helps ensure no typos
 */
type ServiceName = "update-docker-engine.service";

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
