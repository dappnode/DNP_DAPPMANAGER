import {
  ExposableServiceInfo,
  ExposableServiceManifestInfo,
  InstalledPackageData
} from "../../../types";

/**
 * Parse unsafe manifest.exposable property
 */
export function parseExposableServiceManifest(
  dnp: InstalledPackageData,
  manifestExposable: ExposableServiceManifestInfo[]
): ExposableServiceInfo[] {
  if (!manifestExposable || !Array.isArray(manifestExposable)) {
    return [];
  }

  const exposable: ExposableServiceInfo[] = [];

  for (const { name, description, serviceName, port } of manifestExposable) {
    const serviceName_ = serviceName || dnp.containers[0]?.serviceName;
    if (serviceName_ && port) {
      exposable.push({
        name: name || "Exposable service",
        description: description || "",
        dnpName: dnp.dnpName,
        serviceName: serviceName_,
        port
      });
    }
  }

  return exposable;
}
