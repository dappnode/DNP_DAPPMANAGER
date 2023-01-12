import { Compose } from "@dappnode/dappnodesdk";
import { ComposeServicesSharingPid } from "../types";
import { InstallPackageData, PackageContainer } from "@dappnode/common";

/**
 * Check if a package that will be installed/updated
 * contains compose feature pid in any of its services
 */
export function packageToInstallHasPid(pkg: InstallPackageData): boolean {
  for (const service of Object.values(pkg.compose.services)) {
    if (service.pid) return true;
  }
  return false;
}

/**
 * Check if a compose contains pid
 */
export function packageInstalledHasPid(compose: Compose): boolean {
  for (const service of Object.values(compose.services)) {
    if (service.pid) return true;
  }
  return false;
}

export function isTargetPidServiceIncluded(
  targetContainers: PackageContainer[],
  targetPidServices: string[]
): boolean {
  return targetContainers.some(tc =>
    targetPidServices.includes(tc.serviceName)
  );
}

/**
 * Get the target service of the pid feature
 * - Return the target service if found
 * - Return empty string if not found
 */
export function getServicesSharingPid(
  compose: Compose,
  targetContainers?: PackageContainer[]
): ComposeServicesSharingPid | null {
  if (packageInstalledHasPid(compose)) {
    const targetPidServices: string[] = [];
    const dependantPidServices: string[] = [];

    for (const [index, service] of Object.values(compose.services).entries()) {
      if (service.pid) {
        // Pid MUST be present in compose in the format   pid: service:erigon
        const targetPidService = service.pid.split(":")[1];
        const dependantPidService = Object.keys(compose.services)[index];

        // Ensure targetPidService is well formatted and exists in compose
        if (!targetPidService)
          throw Error(
            `target pid service in wrong format: ${targetPidService}`
          );
        if (!Object.keys(compose.services).includes(targetPidService))
          throw Error(
            `target pid service ${targetPidService} not found in the compose`
          );

        targetPidServices.push(targetPidService);
        dependantPidServices.push(dependantPidService);
      }
    }
    // Return null if the targetPid is not included because these
    if (
      targetContainers &&
      !isTargetPidServiceIncluded(targetContainers, targetPidServices)
    )
      return null;
    return { dependantPidServices, targetPidServices };
  }
  return null;
}
