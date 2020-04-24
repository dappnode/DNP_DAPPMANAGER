import * as eventBus from "../eventBus";
import { getDirectory } from "../modules/directory";
import { DirectoryItem } from "../types";
import Logs from "../logs";
import { listContainers } from "../modules/docker/listContainers";
import { getIsInstalled, getIsUpdated } from "./fetchDnpRequest";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { throttle } from "lodash";
import { getEthersProvider } from "../modules/ethClient";
import { ReleaseFetcher } from "../modules/release";
const logs = Logs(module);

const loadThrottle = 500; // 0.5 seconds

/**
 * Fetches all package names in the custom dappnode directory.
 */
export async function fetchDirectory(): Promise<DirectoryItem[]> {
  const provider = await getEthersProvider();
  const releaseFetcher = new ReleaseFetcher();

  // Prevent sending way to many updates in case the fetching process is fast
  const emitDirectoryUpdate = throttle(eventBus.directory.emit, loadThrottle);

  const dnpList = await listContainers();

  // Returns already sorted by: feat#0, feat#1, dnp#0, dnp#1, dnp#2
  const directory = await getDirectory(provider);
  const directoryDnps: DirectoryItem[] = directory.map(
    ({ name, isFeatured }) => ({
      status: "loading",
      name,
      whitelisted: true,
      isFeatured
    })
  );
  emitDirectoryUpdate(directoryDnps);

  await Promise.all(
    directory.map(async ({ name, isFeatured }, idx) => {
      const whitelisted = true;
      const directoryItemBasic = { name, whitelisted, isFeatured };
      try {
        // Now resolve the last version of the package
        const release = await releaseFetcher.getRelease(name);
        const { metadata, avatarFile } = release;

        directoryDnps[idx] = {
          ...directoryItemBasic,
          status: "ok",
          description: getShortDescription(metadata),
          avatarUrl: fileToGatewayUrl(avatarFile), // Must be URL to a resource in a DAPPMANAGER API
          isInstalled: getIsInstalled(release, dnpList),
          isUpdated: getIsUpdated(release, dnpList),
          featuredStyle: metadata.style,
          categories: metadata.categories || getFallBackCategories(name) || []
        };
      } catch (e) {
        logs.error(`Error fetching ${name} release: ${e.message}`);
        directoryDnps[idx] = {
          ...directoryItemBasic,
          status: "error",
          message: e.message
        };
      } finally {
        emitDirectoryUpdate(directoryDnps);
      }
    })
  );

  return directoryDnps;
}

// Helpers

/**
 * Get a short description and trim it
 */
function getShortDescription(metadata: {
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
function getFallBackCategories(dnpName: string): string[] {
  return fallbackCategories[dnpName];
}
