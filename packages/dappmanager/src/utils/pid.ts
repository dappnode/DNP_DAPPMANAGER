import {
  InstallPackageData,
  Compose,
  ComposeServiceSharingPid,
  InstalledPackageData,
  PackageContainer
} from "../types";

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

/**
 * Get the target service of the pid feature
 * - Return the target service if found
 * - Return empty string if not found
 */
export function getServicesSharingPid(
  compose: Compose
): ComposeServiceSharingPid[] {
  const composeServiceWithPid: ComposeServiceSharingPid[] = [];

  for (const [index, service] of Object.values(compose.services).entries()) {
    if (service.pid) {
      // Pid MUST be present in compose in the format   pid: service:erigon
      const targetPidService = service.pid.split(":")[1];
      const serviceWithPid = Object.keys(compose.services)[index];

      // Ensure targetPidService is well formatted and exists in compose
      if (!targetPidService)
        throw Error(`target pid service in wrong format: ${targetPidService}`);
      if (!Object.keys(compose.services).includes(targetPidService))
        throw Error(
          `target pid service ${targetPidService} not found in the compose`
        );

      composeServiceWithPid.push({ targetPidService, serviceWithPid });
    }
  }
  return composeServiceWithPid;
}

export function pushDependantPidContainers(
  compose: Compose,
  dnp: InstalledPackageData,
  targetContainers: PackageContainer[]
): PackageContainer[] {
  const servicesSharingPid = getServicesSharingPid(compose);

  for (const targetContainer of targetContainers) {
    servicesSharingPid.map(s => {
      if (
        s.targetPidService === targetContainer.serviceName &&
        !targetContainers.map(tc => tc.serviceName).includes(s.serviceWithPid)
      ) {
        const containerDependant = dnp.containers.find(
          c => c.serviceName === s.serviceWithPid
        );
        containerDependant && targetContainers.push(containerDependant);
      }
    });
  }

  return targetContainers;
}
