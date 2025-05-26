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
   * 
   * @returns New NotificationsConfig with merged endpoints.
   */
  applyPreviousEndpoints(
    dnpName: string,
    isCore: boolean,
    newNotificationsConfig: NotificationsConfig,
    oldNotificationsConfig?: NotificationsConfig | null
  ): NotificationsConfig {
    if (!oldNotificationsConfig) oldNotificationsConfig = this.getEndpointsIfExists(dnpName, isCore);
    if (!oldNotificationsConfig) return newNotificationsConfig;

    const { endpoints: oldEndpoints, customEndpoints: oldCustomEndpoints } = oldNotificationsConfig;
    const { endpoints: newEndpoints, customEndpoints: newCustomEndpoints } = newNotificationsConfig;

    const mergedEndpoints = newEndpoints?.map((newEndpoint) => {
      const oldEndpoint = oldEndpoints?.find((e) => e.correlationId === newEndpoint.correlationId);
      // If no previous version exists, simply use the new endpoint.
      if (!oldEndpoint) return newEndpoint;

      // Start with new endpoint properties but persist the old "enabled" flag.
      const mergedEndpoint = { ...newEndpoint, ...oldEndpoint };
      mergedEndpoint.enabled = oldEndpoint.enabled;

      // For each condition in the new endpoint, if there is a corresponding old condition,
      // persist its right-hand side value.
      if (newEndpoint.conditions && Array.isArray(newEndpoint.conditions)) {
        mergedEndpoint.conditions = newEndpoint.conditions.map((condition, index) => {
          // Split the new condition into parts using any operator as separator.
          const newParts = condition.split(/([=<>]+)/);
          // If we don't have a complete condition format, use it as is.
          if (newParts.length < 3) return condition;
          const newLeft = newParts[0];
          const newOperator = newParts[1];
          // Default right-hand value from the new condition.
          let newRight = newParts.slice(2).join("");

          // If there's an old condition at the same index, use its right-hand side.
          if (oldEndpoint.conditions && oldEndpoint.conditions[index]) {
            const oldParts = oldEndpoint.conditions[index].split(/([=<>]+)/);
            if (oldParts.length >= 3) newRight = oldParts.slice(2).join("");
          }
          return `${newLeft}${newOperator}${newRight}`;
        });
      }
      return mergedEndpoint;
    });

    const mergedCustomEndpoints = newCustomEndpoints?.map((newCustomEndpoint) => {
      const oldCustomEndpoint = oldCustomEndpoints?.find((e) => e.name === newCustomEndpoint.name);
      if (!oldCustomEndpoint) return newCustomEndpoint;

      // Merge and persist the old "enabled" flag and metric.treshold.
      const mergedCustomEndpoint = { ...newCustomEndpoint, ...oldCustomEndpoint };
      mergedCustomEndpoint.enabled = oldCustomEndpoint.enabled;
      if (mergedCustomEndpoint.metric && oldCustomEndpoint.metric && oldCustomEndpoint.metric.treshold !== undefined)
        mergedCustomEndpoint.metric.treshold = oldCustomEndpoint.metric.treshold;

      return mergedCustomEndpoint;
    });

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
