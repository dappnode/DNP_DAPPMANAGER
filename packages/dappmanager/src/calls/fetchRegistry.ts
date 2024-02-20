import { listPackages } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { DirectoryItem } from "@dappnode/types";
import {
  fileToGatewayUrl,
  getIsInstalled,
  getIsUpdated
} from "@dappnode/utils";
import {
  getShortDescription,
  getFallBackCategories
} from "./fetchDirectory.js";
import { throttle } from "lodash-es";
import { PublicRegistryEntry } from "@dappnode/toolkit";
import { dappnodeInstaller, publicRegistry } from "../index.js";
import { eventBus } from "@dappnode/eventbus";

const loadThrottle = 500; // 0.5 seconds

/**
 * Fetches new repos from registry by scanning the chain
 */
export async function fetchRegistry(): Promise<DirectoryItem[]> {
  const publicPackages = await publicRegistry.queryGraphNewRepos<"public">();
  return await fetchRegistryIpfsData(publicPackages);
}

// Utils

/**
 *  Get IPFS data from registry packages
 */
async function fetchRegistryIpfsData(
  registry: PublicRegistryEntry[]
): Promise<DirectoryItem[]> {
  const dnpList = await listPackages();

  const registryPublicDnps: DirectoryItem[] = [];
  let registryDnpsPending: DirectoryItem[] = [];

  const emitRegistryUpdate = throttle(() => {
    eventBus.registry.emit(registryDnpsPending);
    registryDnpsPending = [];
  }, loadThrottle);

  function pushRegistryItem(item: DirectoryItem): void {
    registryPublicDnps.push(item);
    registryDnpsPending.push(item);
    emitRegistryUpdate();
  }

  await Promise.all(
    registry.map(async ({ name }, index): Promise<void> => {
      const registryItemBasic = {
        index,
        name,
        whitelisted: true,
        isFeatured: false
      };
      try {
        // Now resolve the last version of the package
        const release = await dappnodeInstaller.getRelease(name);
        const { manifest, avatarFile } = release;

        pushRegistryItem({
          ...registryItemBasic,
          status: "ok",
          description: getShortDescription(manifest),
          avatarUrl: fileToGatewayUrl(avatarFile), // Must be URL to a resource in a DAPPMANAGER API
          isInstalled: getIsInstalled(release, dnpList),
          isUpdated: getIsUpdated(release, dnpList),
          featuredStyle: manifest.style,
          categories: manifest.categories || getFallBackCategories(name) || []
        });
      } catch (e) {
        // Avoid spamming the terminal, there could be too many packages validation errors in the public registry
        logs.debug(`Error fetching ${name} release`, e);
        pushRegistryItem({
          ...registryItemBasic,
          status: "error",
          message: e.message
        });
      }
    })
  );

  return registryPublicDnps.sort((a, b) => a.index - b.index);
}
