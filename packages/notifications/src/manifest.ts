import { listPackages } from "@dappnode/dockerapi";
import { CustomEndpoint, GatusEndpoint, Manifest, NotificationsConfig } from "@dappnode/types";
import { getManifestPath } from "@dappnode/utils";
import fs from "fs";

export class NotificationsManifest {
  /**
   * Get gatus and custom endpoints indexed by dnpName from filesystem
   */
  async getEndpoints(): Promise<{
    [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[] };
  }> {
    const packages = await listPackages();

    const endpoints: { [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[] } } = {};
    for (const pkg of packages) {
      const manifestPath = getManifestPath(pkg.dnpName, pkg.isCore);
      const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      if (manifest.notifications?.endpoints) endpoints[pkg.dnpName].endpoints = manifest.notifications.endpoints;
      if (manifest.notifications?.customEndpoints)
        endpoints[pkg.dnpName].customEndpoints = manifest.notifications.customEndpoints;
    }

    return endpoints;
  }

  /**
   * Update endpoint properties in filesystem
   */
  async updateEndpoints(dnpName: string, notificationsConfig: NotificationsConfig): Promise<void> {
    const { endpoints: updatedEndpoints, customEndpoints: updatedCustomEndpoints } = notificationsConfig;

    const manifest: Manifest = JSON.parse(fs.readFileSync(getManifestPath(dnpName, false), "utf8"));
    if (!manifest.notifications) throw new Error("No notifications found in manifest");

    if (updatedEndpoints) {
      const endpoints = manifest.notifications.endpoints;
      if (!endpoints) throw new Error(`No endpoints found in manifest`);
      Object.assign(endpoints, updatedEndpoints);
    }

    if (updatedCustomEndpoints) {
      const customEndpoints = manifest.notifications.customEndpoints;
      if (!customEndpoints) throw new Error(`No custom endpoints found in manifest`);
      Object.assign(customEndpoints, updatedCustomEndpoints);
    }

    fs.writeFileSync(getManifestPath(dnpName, false), JSON.stringify(manifest, null, 2));
  }
}
