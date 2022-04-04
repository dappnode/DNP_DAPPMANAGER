import throttle from "lodash/throttle";
import params from "../params";
import { eventBus } from "../eventBus";
import { DirectoryItem } from "../types";
import { logs } from "../logs";
import { listPackages } from "../modules/docker/list";
import { getIsInstalled, getIsUpdated } from "./fetchDnpRequest";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { getEthersProvider } from "../modules/ethClient";
import { ReleaseFetcher } from "../modules/release";
import { NoImageForArchError } from "../modules/release/errors";
import {
  fetchDpmRegistryPackages,
  sortWithPackageList
} from "../modules/dpm/registry";
import { getRegistryAddress } from "../modules/dpm";

const loadThrottleMs = 500; // 0.5 seconds

/**
 * Fetches all packages with their latest version from a Dappnode Package Registry
 */
export async function fetchRegistry({
  registryName = params.DAPPNODE_MAIN_REGISTRY
}: {
  registryName?: string;
}): Promise<DirectoryItem[]> {
  const provider = await getEthersProvider();
  const releaseFetcher = new ReleaseFetcher();

  const registryAddress = getRegistryAddress(registryName);

  const { packages, packageList } = await fetchDpmRegistryPackages(
    provider,
    registryAddress
  );

  // First push the packages listed in packageList
  // Then push the rest of packages expect the already pushed
  // Returns already sorted by: feat#0, feat#1, dnp#0, dnp#1, dnp#2
  const packagesSorted = sortWithPackageList(packageList, packages);
  const packageSet = new Set(packageList);

  const registryDnps: DirectoryItem[] = [];

  let registryDnpsPending: DirectoryItem[] = [];
  // Prevent sending way to many updates in case the fetching process is fast
  const emitRegistryUpdate = throttle(() => {
    eventBus.registry.emit({ registryName, items: registryDnpsPending });
    registryDnpsPending = [];
  }, loadThrottleMs);

  function pushRegistryItem(item: DirectoryItem): void {
    registryDnps.push(item);
    registryDnpsPending.push(item);
    emitRegistryUpdate();
  }

  const dnpList = await listPackages();

  await Promise.all(
    packagesSorted.map(async (pkg, index): Promise<void> => {
      // Ignore packages as set in the registry contract
      if (!pkg.flags.visible || pkg.flags.banned) {
        return;
      }

      const whitelisted = true;
      const dnpName = `${pkg.repoName}.${registryName}`;

      const registryItemBasic = {
        index,
        dnpName,
        whitelisted,
        isFeatured: packageSet.has(index),
        isVerified: pkg.flags.validated
      };
      try {
        // Now resolve the last version of the package
        const release = await releaseFetcher.getRelease(dnpName);
        const { metadata, avatarFile } = release;

        pushRegistryItem({
          ...registryItemBasic,
          status: "ok",
          description: getShortDescription(metadata),
          avatarUrl: fileToGatewayUrl(avatarFile), // Must be URL to a resource in a DAPPMANAGER API
          isInstalled: getIsInstalled(release, dnpList),
          isUpdated: getIsUpdated(release, dnpList),
          featuredStyle: metadata.style,
          categories:
            metadata.categories || getFallBackCategories(dnpName) || []
        });
      } catch (e) {
        if (e instanceof NoImageForArchError) {
          logs.debug(`Package ${dnpName} is not available in current arch`);
        } else {
          logs.error(`Error fetching ${dnpName} release`, e);
          pushRegistryItem({
            ...registryItemBasic,
            status: "error",
            message: e.message
          });
        }
      }
    })
  );

  return registryDnps.sort((a, b) => a.index - b.index);
}

// Helpers

/**
 * Get a short description and trim it
 */
export function getShortDescription(metadata: {
  description?: string;
  shortDescription?: string;
}): string {
  const desc =
    metadata.shortDescription || metadata.description || "No description";
  // Don't send big descriptions, the UI crops them anyway
  return desc.slice(0, 80);
}

const fallbackCategories: { [dnpName: string]: string[] } = {
  "kovan.dnp.dappnode.eth": ["Developer tools"],
  "artis-sigma1.public.dappnode.eth": ["Blockchain"],
  "monero.dnp.dappnode.eth": ["Blockchain"],
  "vipnode.dnp.dappnode.eth": ["Economic incentive"],
  "ropsten.dnp.dappnode.eth": ["Developer tools"],
  "rinkeby.dnp.dappnode.eth": ["Developer tools"],
  "lightning-network.dnp.dappnode.eth": [
    "Payment channels",
    "Economic incentive"
  ],
  "swarm.dnp.dappnode.eth": ["Storage", "Communications"],
  "goerli-geth.dnp.dappnode.eth": ["Developer tools"],
  "bitcoin.dnp.dappnode.eth": ["Blockchain"],
  "raiden-testnet.dnp.dappnode.eth": ["Developer tools"],
  "raiden.dnp.dappnode.eth": ["Payment channels"]
};

/**
 * For known packages that are not yet updated, used this for nicer UX
 * until all of them are updated
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 */
export function getFallBackCategories(dnpName: string): string[] {
  return fallbackCategories[dnpName];
}
