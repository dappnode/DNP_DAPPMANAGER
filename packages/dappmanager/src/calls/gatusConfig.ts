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
export async function gatusGetEndpoints(): Promise<Map<string, Endpoint[]>> {
  const packages = await listPackages();

  // Read all manifests files and retrieve the gatus config
  const endpoints = new Map<string, Endpoint[]>();
  for (const pkg of packages) {
    const manifestPath = getManifestPath(pkg.dnpName, pkg.isCore);
    const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (manifest.notifications) endpoints.set(pkg.dnpName, manifest.notifications.endpoints);
  }

  return endpoints;
}

/**
 * Update endpoint properties
 * @param dnpName
 * @param updatedEndpoint
 */
export async function gatusUpdateEndpoint({
  dnpName,
  updatedEndpoint
}: {
  dnpName: string;
  updatedEndpoint: Endpoint;
}): Promise<void> {
  // Get current endpoint status
  const manifest: Manifest = JSON.parse(fs.readFileSync(getManifestPath(dnpName, false), "utf8"));
  if (!manifest.notifications) throw new Error("No notifications found in manifest");

  const endpoint = manifest.notifications.endpoints.find((e) => e.name === updatedEndpoint.name);
  if (!endpoint) throw new Error(`Endpoint ${updatedEndpoint.name} not found in manifest`);

  // Update endpoint
  Object.assign(endpoint, updatedEndpoint);

  // Save manifest
  fs.writeFileSync(getManifestPath(dnpName, false), JSON.stringify(manifest, null, 2));

  // Update endpoint in gatus
  // await fetch(`http://notifier.notifications.dappnode:8082/gatus/endpoints`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json"
  //   },
  //   body: JSON.stringify(endpoint)
  // });
}
