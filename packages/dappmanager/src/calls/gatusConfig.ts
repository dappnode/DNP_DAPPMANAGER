import { listPackages } from "@dappnode/dockerapi";
import { Endpoint, Manifest, Notification } from "@dappnode/types";
import { getManifestPath } from "@dappnode/utils";
import fs from "fs";

/**
 * Get all the notifications
 * @returns all the notifications
 */
export async function gatuGetAllNotifications(): Promise<Notification[]> {
  const response = await fetch(`http://notifier.notifications.dappnode:8080/api/v1/notifications`);
  return response.json();
}

/**
 * Get gatus endpoints indexed by dnpName
 */
export async function gatusGetEndpoints(): Promise<{ [dnpName: string]: Endpoint[] }> {
  const packages = await listPackages();

  // Read all manifests files and retrieve the gatus config
  const endpoints: { [dnpName: string]: Endpoint[] } = {};
  for (const pkg of packages) {
    const manifestPath = getManifestPath(pkg.dnpName, pkg.isCore);
    const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (manifest.notifications) {
      endpoints[pkg.dnpName] = manifest.notifications.endpoints;
    }
  }

  return endpoints;
}

/**
 * Update endpoint properties
 * @param dnpName
 * @param updatedEndpoints
 */
export async function gatusUpdateEndpoints({
  dnpName,
  updatedEndpoints
}: {
  dnpName: string;
  updatedEndpoints: Endpoint[];
}): Promise<void> {
  // Get current endpoint status
  const manifest: Manifest = JSON.parse(fs.readFileSync(getManifestPath(dnpName, false), "utf8"));
  if (!manifest.notifications) throw new Error("No notifications found in manifest");

  const endpoints = manifest.notifications.endpoints;
  if (!endpoints) throw new Error(`No endpoints found in manifest`);

  // Update endpoint
  Object.assign(endpoints, updatedEndpoints);

  // Save manifest
  fs.writeFileSync(getManifestPath(dnpName, false), JSON.stringify(manifest, null, 2));

  // Trigger reload. Gatus will execute reload at a minimum interval of x seconds
  await fetch(`http://notifier.notifications.dappnode:8082/api/v1/gatus/endpoints/reload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });
}
