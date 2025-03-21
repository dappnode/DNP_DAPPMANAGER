import { listPackages } from "@dappnode/dockerapi";
import { CustomEndpoint, GatusEndpoint, Manifest, NotificationsConfig } from "@dappnode/types";
import { getManifestPath } from "@dappnode/utils";
import fs from "fs";

export class NotificationsManifest {
  /**
   * Get gatus and custom endpoints indexed by dnpName from filesystem
   */
  async getEndpoints(): Promise<{
    [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
  }> {
    const packages = await listPackages();

    const notificationsEndpoints: {
      [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
    } = {};
    for (const pkg of packages) {
      const { dnpName, isCore } = pkg;
      const manifestPath = getManifestPath(dnpName, isCore);
      const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

      if (!manifest.notifications) continue;

      if (!notificationsEndpoints[pkg.dnpName]) {
        notificationsEndpoints[pkg.dnpName] = { endpoints: [], customEndpoints: [], isCore: isCore };
      }
      const { endpoints, customEndpoints } = manifest.notifications;
      if (endpoints) notificationsEndpoints[dnpName].endpoints = endpoints;
      if (customEndpoints) notificationsEndpoints[dnpName].customEndpoints = customEndpoints;
    }

    return notificationsEndpoints;
  }

  /**
   * Update endpoint properties in filesystem
   */
  updateEndpoints(dnpName: string, isCore: boolean, notificationsConfig: NotificationsConfig): void {
    const { endpoints: updatedEndpoints, customEndpoints: updatedCustomEndpoints } = notificationsConfig;

    const manifest: Manifest = JSON.parse(fs.readFileSync(getManifestPath(dnpName, isCore), "utf8"));
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

    fs.writeFileSync(getManifestPath(dnpName, isCore), JSON.stringify(manifest, null, 2));
  }
}
