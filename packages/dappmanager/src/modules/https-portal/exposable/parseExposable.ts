import {
  ExposableServiceInfo,
  ExposableServiceManifestInfo,
  InstalledPackageData
} from "../../../types";
import { getPublicSubdomain } from "../../../domains";

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

  for (const info of manifestExposable) {
    const serviceName = info.serviceName || dnp.containers[0]?.serviceName;

    if (serviceName && info.port) {
      const defaultFromSubdomain = getPublicSubdomain({
        dnpName: dnp.dnpName,
        serviceName
      });

      if (
        info.fromSubdomain &&
        !defaultFromSubdomain.includes(info.fromSubdomain)
      ) {
        // Illegal fromSubdomain, MUST include the default subdomain
        continue;
      }

      exposable.push({
        name: info.name || "Exposable service",
        description: info.description || "",
        fromSubdomain: info.fromSubdomain || defaultFromSubdomain,
        dnpName: dnp.dnpName,
        serviceName,
        port: info.port
      });
    }
  }

  return exposable;
}
