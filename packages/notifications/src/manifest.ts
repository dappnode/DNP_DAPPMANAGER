import { listPackages } from "@dappnode/dockerapi";
import { CustomEndpoint, GatusEndpoint, Manifest, NotificationsConfig } from "@dappnode/types";
import { getManifestPath } from "@dappnode/utils";
import fs from "fs";

export class NotificationsManifest {
  /**
   * Get gatus and custom endpoints indexed by dnpName from filesystem
   */
  async getAllEndpoints(): Promise<{
    [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
  }> {
    const packages = await listPackages();

    const notificationsEndpoints: {
      [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[]; isCore: boolean };
    } = {};
    for (const pkg of packages) {
      const { dnpName, isCore } = pkg;
      const manifestPath = getManifestPath(dnpName, isCore);
      if (!fs.existsSync(manifestPath)) continue;

      const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      if (!manifest.notifications) continue;

      const { endpoints, customEndpoints } = manifest.notifications;
      notificationsEndpoints[dnpName] = { endpoints: endpoints || [], customEndpoints: customEndpoints || [], isCore };
    }

    return notificationsEndpoints;
  }

  /**
   * Get package endpoints (if exists) properties from filesystem
   */
  getEndpointsIfExists(dnpName: string, isCore: boolean): NotificationsConfig | null {
    const manifestPath = getManifestPath(dnpName, isCore);
    if (!fs.existsSync(manifestPath)) return { endpoints: [], customEndpoints: [] };

    const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (!manifest.notifications) return { endpoints: [], customEndpoints: [] };

    const { endpoints, customEndpoints } = manifest.notifications;
    return { endpoints: endpoints || [], customEndpoints: customEndpoints || [] };
  }

  /**
   * Joins new endpoints with previous ones. If there are repeated endpoints:
   * - GatusEndpoint: iterate over the conditions properties and split with regex matching any operator. If the right side is a number or a string, keep the old one.
   * - CustomEndpoint: check the metric.treshold and keep the old one.
   *
   * Do not keep old endpoints that are not present in the new ones.
   */
  applyPreviousEndpoints(
    dnpName: string,
    isCore: boolean,
    newNotificationsConfig: NotificationsConfig
  ): NotificationsConfig {
    const oldNotificationsConfig = this.getEndpointsIfExists(dnpName, isCore);
    if (!oldNotificationsConfig) return newNotificationsConfig;

    const { endpoints: oldEndpoints, customEndpoints: oldCustomEndpoints } = oldNotificationsConfig;
    const { endpoints: newEndpoints, customEndpoints: newCustomEndpoints } = newNotificationsConfig;

    const mergedEndpoints = oldEndpoints
      ?.map((oldEndpoint) => {
        const newEndpoint = newEndpoints?.find((newEndpoint) => newEndpoint.name === oldEndpoint.name);
        if (!newEndpoint) return null;

        const mergedEndpoint = { ...oldEndpoint, ...newEndpoint };
        if (mergedEndpoint.conditions) {
          mergedEndpoint.conditions = mergedEndpoint.conditions.map((condition) => {
            const [left, operator, right] = condition.split(/([=<>]+)/);
            if (left && operator && right && (Number(right) || right === "0")) return condition;
            return condition;
          });
        }

        return mergedEndpoint;
      })
      .filter((endpoint) => endpoint !== null);

    const mergedCustomEndpoints = oldCustomEndpoints
      ?.map((oldCustomEndpoint) => {
        const newCustomEndpoint = newCustomEndpoints?.find(
          (newCustomEndpoint) => newCustomEndpoint.name === oldCustomEndpoint.name
        );
        if (!newCustomEndpoint) return null;

        const mergedCustomEndpoint = { ...oldCustomEndpoint, ...newCustomEndpoint };
        if (mergedCustomEndpoint.metric && oldCustomEndpoint.metric)
          mergedCustomEndpoint.metric.treshold = oldCustomEndpoint.metric.treshold;

        return mergedCustomEndpoint;
      })
      .filter((customEndpoint) => customEndpoint !== null);

    return { endpoints: mergedEndpoints, customEndpoints: mergedCustomEndpoints };
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
