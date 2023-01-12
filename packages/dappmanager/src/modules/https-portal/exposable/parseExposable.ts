import {
  ExposableServiceInfo,
  ExposableServiceManifestInfo,
  InstalledPackageData
} from "@dappnode/common";
import { getPublicSubdomain, stripBadDomainChars } from "../../../domains";

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
      // Ensure that the predefined subdomain contains at least part of the dnpName
      const rootSubdomain = stripBadDomainChars(dnp.dnpName.split(".")[0]);
      const defaultFromSubdomain = getPublicSubdomain({
        dnpName: dnp.dnpName,
        serviceName
      });

      if (info.fromSubdomain && !rootSubdomain.includes(info.fromSubdomain)) {
        // Illegal fromSubdomain, MUST include root dnpName
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
