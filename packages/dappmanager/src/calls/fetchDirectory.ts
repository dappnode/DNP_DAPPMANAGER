import { eventBus } from "../eventBus";
import { getDirectory } from "../modules/directory";
import { DirectoryItem, DirectoryItemOk } from "@dappnode/common";
import { logs } from "../logs";
import { listPackages } from "../modules/docker/list";
import { getIsInstalled, getIsUpdated } from "./fetchDnpRequest";
import { fileToGatewayUrl } from "../utils/distributedFile";
import { throttle } from "lodash-es";
import { getEthersProvider } from "../modules/ethClient";
import { ReleaseFetcher } from "../modules/release";
import { NoImageForArchError } from "../modules/release/errors";

const loadThrottle = 500; // 0.5 seconds

/**
 * Fetches all package names in the custom dappnode directory.
 */
export async function fetchDirectory(): Promise<DirectoryItem[]> {
  const provider = await getEthersProvider();
  const releaseFetcher = new ReleaseFetcher();

  const dnpList = await listPackages();

  // Returns already sorted by: feat#0, feat#1, dnp#0, dnp#1, dnp#2
  const directory = await getDirectory(provider);
  const directoryDnps: DirectoryItem[] = [];

  let directoryDnpsPending: DirectoryItem[] = [];
  // Prevent sending way to many updates in case the fetching process is fast
  const emitDirectoryUpdate = throttle(() => {
    eventBus.directory.emit(directoryDnpsPending);
    directoryDnpsPending = [];
  }, loadThrottle);

  function pushDirectoryItem(item: DirectoryItem): void {
    directoryDnps.push(item);
    directoryDnpsPending.push(item);
    emitDirectoryUpdate();
  }

  await Promise.all(
    directory.map(async ({ name, isFeatured }, index): Promise<void> => {
      const whitelisted = true;
      const directoryItemBasic = { index, name, whitelisted, isFeatured };
      try {
        // Now resolve the last version of the package
        const release = await releaseFetcher.getRelease(name);
        const { metadata, avatarFile } = release;

        pushDirectoryItem({
          ...directoryItemBasic,
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
          pushDirectoryItem({
            ...directoryItemBasic,
            status: "error",
            message: e.message
          });
        }
      }
    })
  );

  directoryDnps.push(stakerMainnetCard, stakerGnosisCard);

  return directoryDnps.sort((a, b) => a.index - b.index);
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

const stakerMainnetCard: DirectoryItemOk = {
  index: 0,
  name: "ethereum.dnp.dappnode.eth",
  whitelisted: true,
  isFeatured: true,
  status: "ok",
  description: "Easily set-up your Ethereum node and validator",
  avatarUrl: "/ipfs/QmQBRqfs5D1Fubd6SwBmfruMfisEWN5dGN7azPhCsTY13y", // Ethereum image logo
  isInstalled: false,
  isUpdated: false,
  featuredStyle: {
    featuredBackground: "linear-gradient(67deg, rgb(0, 0, 0), rgb(18, 57, 57))",
    featuredColor: "white",
    featuredAvatarFilter: ""
  },
  categories: []
};

const stakerGnosisCard: DirectoryItemOk = {
  index: 0,
  name: "gnosis.dnp.dappnode.eth",
  whitelisted: true,
  isFeatured: true,
  status: "ok",
  description: "Easily set-up your Gnosis Chain node and validator",
  avatarUrl: "/ipfs/QmcHzRr3BDJM4rb4MXBmPR5qKehWPqpwxrFQQeNcV3mvmS", // Gnosis image logo
  isInstalled: false,
  isUpdated: false,
  featuredStyle: {
    featuredBackground: "linear-gradient(67deg, rgb(0, 0, 0), rgb(18, 57, 57))",
    featuredColor: "white",
    featuredAvatarFilter: ""
  },
  categories: []
};
