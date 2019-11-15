import { ReturnData } from "../route-types/fetchDirectory";
import getDirectory from "../modules/release/getDirectory";
import getRelease from "../modules/release/getRelease";
import isSyncing from "../utils/isSyncing";
import { RpcHandlerReturnWithResult, DirectoryItem } from "../types";
import Logs from "../logs";
import { listContainers } from "../modules/docker/listContainers";
import { notUndefined } from "../utils/typingHelpers";
import { getIsInstalled, getIsUpdated } from "./fetchDnpRequest";
import { fileToGatewayUrl } from "../utils/distributedFile";
const logs = Logs(module);

/**
 * Fetches all package names in the custom dappnode directory.
 */
export default async function fetchDirectory(): RpcHandlerReturnWithResult<
  ReturnData
> {
  if (Boolean(await isSyncing())) {
    return {
      message: `Mainnet is still syncing`,
      result: [],
      logMessage: true
    };
  }

  const dnpList = await listContainers();

  // const directoryItemsUnordered: DirectoryItem[] = [];

  const directoryDnps = (await Promise.all(
    // Returns already sorted by: feat#0, feat#1, dnp#0, dnp#1, dnp#2
    (await getDirectory()).map(async ({ name, isFeatured }) => {
      try {
        // Now resolve the last version of the package
        const release = await getRelease(name);
        const { metadata, avatarFile } = release;

        return {
          name,
          description: getShortDescription(metadata),
          avatarUrl: fileToGatewayUrl(avatarFile), // Must be URL to a resource in a DAPPMANAGER API
          isInstalled: getIsInstalled(release, dnpList),
          isUpdated: getIsUpdated(release, dnpList),
          whitelisted: true,
          isFeatured,
          featuredStyle: metadata.style,
          categories: metadata.categories || getFallBackCategories(name) || []
        } as DirectoryItem;
      } catch (e) {
        logs.error(`Error fetching ${name} release: ${e.message}`);
      }
    })
  )).filter(notUndefined);

  return {
    message: `Listed directory of ${directoryDnps.length} DNPs`,
    result: directoryDnps,
    logMessage: true
  };
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
