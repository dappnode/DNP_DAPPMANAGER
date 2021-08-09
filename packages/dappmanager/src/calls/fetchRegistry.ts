import { getEthersProvider } from "../modules/ethClient";
import { ReleaseFetcher } from "../modules/release";
import { listPackages } from "../modules/docker/list";
import { getRegistry } from "../modules/registry";
import { eventBus } from "../eventBus";
import { throttle } from "lodash";
import { NoImageForArchError } from "../modules/release/errors";
import { logs } from "../logs";
import { DirectoryItem } from "../types";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { getIsInstalled, getIsUpdated } from "./fetchDnpRequest";
import { getShortDescription, getFallBackCategories } from "./fetchDirectory";

const defaultEnsName = "public.dappnode.eth";
const fistBlockPublicRegistry = 6312046;

const loadThrottle = 500; // 0.5 seconds

/**
 * Fetches all package names in the registry SC.
 */
export async function fetchRegistry({
  addressOrEnsName = defaultEnsName,
  fromBlock,
  toBlock
}: {
  addressOrEnsName: string;
  fromBlock?: number;
  toBlock?: number;
}): Promise<DirectoryItem[]> {
  const provider = await getEthersProvider();
  const releaseFetcher = new ReleaseFetcher();

  const dnpList = await listPackages();

  const registry = await getRegistry(
    provider,
    addressOrEnsName,
    fromBlock || fistBlockPublicRegistry,
    toBlock
  );
  const registryPublicDnps: DirectoryItem[] = [];

  let registryDnpsPending: DirectoryItem[] = [];
  // Prevent sending way to many updates in case the fetching process is fast
  const emitRegistryUpdate = throttle(() => {
    eventBus.directory.emit(registryDnpsPending);
    registryDnpsPending = [];
  }, loadThrottle);

  function pushRegistryItem(item: DirectoryItem): void {
    registryPublicDnps.push(item);
    registryDnpsPending.push(item);
    emitRegistryUpdate();
  }

  await Promise.all(
    registry.map(
      async ({ name, isFeatured }, index): Promise<void> => {
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
      }
    )
  );

  return registryPublicDnps;
}
