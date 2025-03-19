import { listPackages } from "@dappnode/dockerapi";
import { CustomEndpoint, GatusEndpoint, Manifest, Notification, NotificationsConfig } from "@dappnode/types";
import { getManifestPath } from "@dappnode/utils";
import fs from "fs";

const BASE_URL = "http://notifier.notifications.dappnode";

/**
 * Get all the notifications
 * @returns all the notifications
 */
export async function notificationsGetAll(): Promise<Notification[]> {
  const response = await fetch(new URL("/api/v1/notifications", `${BASE_URL}:8080`).toString());
  return response.json();
}

/**
 * Get gatus and custom endpoints indexed by dnpName
 */
export async function notificationsGetEndpoints(): Promise<{
  [dnpName: string]: { endpoints: GatusEndpoint[]; customEndpoints: CustomEndpoint[] };
}> {
  const packages = await listPackages();

  // Read all manifests files and retrieve the gatus config
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
 * Update endpoint properties
 */
export async function notificationsUpdateEndpoints({
  dnpName,
  notificationsConfig
}: {
  dnpName: string;
  notificationsConfig: NotificationsConfig;
}): Promise<void> {
  const { endpoints: updatedEndpoints, customEndpoints: updatedCustomEndpoints } = notificationsConfig;

  // Get current endpoint status
  const manifest: Manifest = JSON.parse(fs.readFileSync(getManifestPath(dnpName, false), "utf8"));
  if (!manifest.notifications) throw new Error("No notifications found in manifest");

  // Update endpoints
  if (updatedEndpoints) {
    const endpoints = manifest.notifications.endpoints;
    if (!endpoints) throw new Error(`No endpoints found in manifest`);

    // Update endpoint
    Object.assign(endpoints, updatedEndpoints);
  }

  // Update custom endpoints
  if (updatedCustomEndpoints) {
    const customEndpoints = manifest.notifications.customEndpoints;
    if (!customEndpoints) throw new Error(`No custom endpoints found in manifest`);

    // Update custom endpoint
    Object.assign(customEndpoints, updatedCustomEndpoints);
  }

  // Save manifest
  fs.writeFileSync(getManifestPath(dnpName, false), JSON.stringify(manifest, null, 2));

  // Trigger reload. Gatus will execute reload at a minimum interval of x seconds
  await fetch(new URL("/api/v1/gatus/endpoints/reload", `${BASE_URL}:8082`).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });
}
