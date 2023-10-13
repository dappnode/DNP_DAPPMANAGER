import { getEthersProvider } from "../modules/ethClient/index.js";
import { ReleaseFetcher } from "../modules/release/index.js";
import { listPackages } from "@dappnode/dockerapi";
import { eventBus } from "@dappnode/eventbus";
import { throttle } from "lodash-es";
import { NoImageForArchError } from "../modules/release/errors.js";
import { logs } from "@dappnode/logger";
import { DirectoryItem, RegistryScanProgress } from "@dappnode/common";
import { fileToGatewayUrl } from "@dappnode/utils";
import { getIsInstalled, getIsUpdated } from "./fetchDnpRequest.js";
import {
  getShortDescription,
  getFallBackCategories
} from "./fetchDirectory.js";
import { getRegistry } from "../modules/registry/index.js";
import * as db from "@dappnode/db";
import { DirectoryDnp } from "@dappnode/toolkit";

const defaultEnsName = "public.dappnode.eth";
const minDeployBlock = 6312046;

const loadThrottle = 500; // 0.5 seconds

/**
 * Return last block and last fetched block
 * to show progress in the UI
 */
export async function fetchRegistryProgress({
  addressOrEnsName = defaultEnsName,
  fromBlock = minDeployBlock
}: {
  addressOrEnsName?: string;
  fromBlock?: number;
}): Promise<RegistryScanProgress> {
  const lastFetchedBlock =
    db.registryLastFetchedBlock.get(addressOrEnsName) || fromBlock;

  let latestBlock = db.registryLastProviderBlock.get();
  if (!latestBlock) {
    const provider = await getEthersProvider();
    latestBlock = await provider.getBlockNumber();
  }

  return {
    lastFetchedBlock,
    latestBlock
  };
}

/**
 * Fetches new repos from registry by scanning the chain
 */
export async function fetchRegistry({
  addressOrEnsName = defaultEnsName,
  fromBlock = minDeployBlock
}: {
  addressOrEnsName?: string;
  fromBlock?: number;
}): Promise<DirectoryItem[]> {
  const provider = await getEthersProvider();
  const registry = await getRegistry(provider, addressOrEnsName, fromBlock);
  return await fetchRegistryIpfsData(registry);
}

// Utils

/**
 *  Get IPFS data from registry packages
 */
async function fetchRegistryIpfsData(
  registry: DirectoryDnp[]
): Promise<DirectoryItem[]> {
  const releaseFetcher = new ReleaseFetcher();
  const dnpList = await listPackages();

  const registryPublicDnps: DirectoryItem[] = [];

  let registryDnpsPending: DirectoryItem[] = [];
  // Prevent sending way to many updates in case the fetching process is fast
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
    registry.map(async ({ name, isFeatured }, index): Promise<void> => {
      const registryItemBasic = {
        index,
        name,
        whitelisted: true,
        isFeatured
      };
      try {
        // Now resolve the last version of the package
        const release = await releaseFetcher.getRelease(name);
        const { metadata, avatarFile } = release;

        pushRegistryItem({
          ...registryItemBasic,
          status: "ok",
          description: getShortDescription(metadata),
          avatarUrl: fileToGatewayUrl(avatarFile), // Must be URL to a resource in a DAPPMANAGER API
          isInstalled: getIsInstalled(release, dnpList),
          isUpdated: getIsUpdated(release, dnpList),
          featuredStyle: metadata.style,
          categories: metadata.categories || getFallBackCategories(name) || []
        });
      } catch (e) {
        if (e instanceof NoImageForArchError) {
          logs.debug(`Package ${name} is not available in current arch`);
        } else {
          logs.error(`Error fetching ${name} release`, e);
          pushRegistryItem({
            ...registryItemBasic,
            status: "error",
            message: e.message
          });
        }
      }
    })
  );

  return registryPublicDnps;
}
