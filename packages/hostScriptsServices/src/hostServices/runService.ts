import path from "path";
import fs from "fs";
import { params } from "@dappnode/params";
import { shellHost } from "@dappnode/utils";
import { reloadServices } from "./reloadServices.js";
import { copyHostService } from "./copyHostService.js";

/**
 * Service runners. Helps ensure no typos
 */
export type ServiceName = "update-upgrade-host.service" | "recreate-dappnode.service" | "docker-upgrade.service";

/**
 * Returns the ordered list of candidate paths where a host service unit file may exist.
 * Exported for testing purposes.
 */
export function getCandidateServicePaths(serviceName: string): string[] {
  return [
    // Primary: absolute source dir set in params (Dockerfile copies hostServices here)
    path.join(params.HOST_SERVICES_SOURCE_DIR, serviceName),
    // Fallback 1: DNCORE bind-volume path inside the container
    path.join(params.DNCORE_DIR, "services/host", serviceName),
    // Fallback 2: package directory copied by the build stage (alternative image layouts)
    path.join(params.HOST_SERVICES_SOURCE_DIR_FALLBACK, serviceName)
  ];
}

/**
 * Resolve the path of a service unit file, trying multiple candidate locations.
 * Returns the first path that exists, or undefined if none are found.
 * @param serviceName - name of the service unit file
 * @param candidatePaths - optional override for candidate paths (used in tests)
 */
export function resolveServicePath(serviceName: string, candidatePaths?: string[]): string | undefined {
  const paths = candidatePaths ?? getCandidateServicePaths(serviceName);
  return paths.find((p) => fs.existsSync(p));
}

/**
 * Run a service for the hostService folder
 * @param serviceName "update-docker-engine.service"
 * sytemd service info: https://www.freedesktop.org/software/systemd/man/systemd.service.html
 */
export async function runService(serviceName: ServiceName, reload: boolean, args = ""): Promise<string> {
  try {
    // Check if service exists in any known location
    const servicePath = resolveServicePath(serviceName);
    if (!servicePath) {
      const tried = getCandidateServicePaths(serviceName).join(", ");
      throw Error(`Host service ${serviceName} not found. Tried: ${tried}`);
    }

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
