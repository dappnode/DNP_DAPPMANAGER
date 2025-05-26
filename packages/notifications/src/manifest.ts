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
   * Merges new and previous notifications configurations by taking all fields from the new config
   * except for the `enabled` flag (for both Gatus and Custom endpoints) and the
   * `metric.treshold` (for Custom endpoints only), which are preserved from the old config.
   * Endpoints are matched by `correlationId`
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
      // If no previous version exists, return the new endpoint as-is
      if (!oldEndpoint) return newEndpoint;

      // Copy all fields from the new endpoint, but preserve the old enabled flag
      const mergedEndpoint: GatusEndpoint = { ...newEndpoint, enabled: oldEndpoint.enabled };
      // Persist old threshold value by preserving each condition's right-hand side
      if (newEndpoint.conditions && Array.isArray(newEndpoint.conditions) && oldEndpoint.conditions) {
        mergedEndpoint.conditions = newEndpoint.conditions.map((condition, index) => {
          const parts = condition.split(/([=<>]+)/);
          if (parts.length < 3) return condition;
          const left = parts[0];
          const operator = parts[1];
          let right = parts.slice(2).join("");
          const oldCond = oldEndpoint.conditions[index];
          if (oldCond) {
            const oldParts = oldCond.split(/([=<>]+)/);
            if (oldParts.length >= 3) right = oldParts.slice(2).join("");
          }
          return `${left}${operator}${right}`;
        });
      }
      return mergedEndpoint;
    });

    const mergedCustomEndpoints = newCustomEndpoints?.map((newCustomEndpoint) => {
      const oldCustomEndpoint = oldCustomEndpoints?.find((e) => e.correlationId === newCustomEndpoint.correlationId);
      // If no previous version exists, return the new custom endpoint as-is
      if (!oldCustomEndpoint) return newCustomEndpoint;

      // Copy all fields from the new custom endpoint, but preserve old enabled and metric.treshold
      const mergedCustomEndpoint: CustomEndpoint = { ...newCustomEndpoint, enabled: oldCustomEndpoint.enabled };
      if (mergedCustomEndpoint.metric && oldCustomEndpoint.metric && oldCustomEndpoint.metric.treshold !== undefined) {
        mergedCustomEndpoint.metric.treshold = oldCustomEndpoint.metric.treshold;
      }
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
