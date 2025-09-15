import { eventBus } from "@dappnode/eventbus";
import { DirectoryItem, DirectoryItemOk } from "@dappnode/types";
import { logs } from "@dappnode/logger";
import { listPackages } from "@dappnode/dockerapi";
import { fileToGatewayUrl, getIsInstalled, getIsUpdated } from "@dappnode/utils";
import { throttle } from "lodash-es";
import { dappnodeInstaller, directory } from "../index.js";

const loadThrottle = 500; // 0.5 seconds

/**
 * Fetches all package names in the custom dappnode directory.
 */
export async function fetchDirectory(): Promise<DirectoryItem[]> {
  const installedDnpList = await listPackages();

  // Returns already sorted by: feat#0, feat#1, dnp#0, dnp#1, dnp#2
  const directoryPkgs = await directory.getDirectoryPkgs();

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
    directoryPkgs.map(async ({ name, isFeatured }, index): Promise<void> => {
      const whitelisted = true;
      const directoryItemBasic = { index, name, whitelisted, isFeatured };
      try {
        // Now resolve the last version of the package
        const release = await dappnodeInstaller.getRelease(name);
        const { manifest, avatarFile } = release;

        pushDirectoryItem({
          ...directoryItemBasic,
          status: "ok",
          description: getShortDescription(manifest),
          avatarUrl: fileToGatewayUrl(avatarFile), // Must be URL to a resource in a DAPPMANAGER API
          isInstalled: getIsInstalled(release, installedDnpList),
          isUpdated: getIsUpdated(release, installedDnpList),
          featuredStyle: manifest.style,
          categories: manifest.categories || getFallBackCategories(name) || []
        });
      } catch (e) {
        // This error might spam the console, print only the message
        logs.warn(`Error fetching ${name} release: ${e.message}`);
        pushDirectoryItem({
          ...directoryItemBasic,
          status: "error",
          message: e.message
        });
      }
    })
  );

  directoryDnps.push(stakerMainnetCard, stakerGnosisCard, stakeHouseCard);

  return directoryDnps.sort((a, b) => a.index - b.index);
}

// Helpers

/**
 * Get a short description and trim it
 */
export function getShortDescription(metadata: { description?: string; shortDescription?: string }): string {
  const desc = metadata.shortDescription || metadata.description || "No description";
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
  "lightning-network.dnp.dappnode.eth": ["Payment channels", "Economic incentive"],
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
  avatarUrl: fileToGatewayUrl({
    hash: "QmQBRqfs5D1Fubd6SwBmfruMfisEWN5dGN7azPhCsTY13y",
    source: "ipfs",
    size: 0,
    imageName: "ethereum-logo.png"
  }), // Ethereum image logo
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
  avatarUrl: fileToGatewayUrl({
    hash: "QmcHzRr3BDJM4rb4MXBmPR5qKehWPqpwxrFQQeNcV3mvmS",
    source: "ipfs",
    size: 0,
    imageName: "gnosis-logo.png"
  }), // Gnosis image logo
  isInstalled: false,
  isUpdated: false,
  featuredStyle: {
    featuredBackground: "linear-gradient(67deg, rgb(0, 0, 0), rgb(18, 57, 57))",
    featuredColor: "white",
    featuredAvatarFilter: ""
  },
  categories: []
};

const stakeHouseCard: DirectoryItemOk = {
  index: 0,
  name: "stakehouse.dnp.dappnode.eth",
  whitelisted: true,
  isFeatured: true,
  status: "ok",
  description: "Join or create an LSD Network and stake a validator with 4 ETH.",
  avatarUrl: fileToGatewayUrl({
    hash: "QmPZ7KYwjXEXDjEj5A2iXbQ2oj9bMWKgBNJBRgUxGNCjmw",
    source: "ipfs",
    size: 0,
    imageName: "stakehouse-logo.png"
  }), // Stakehouse image logo
  isInstalled: false,
  isUpdated: false,
  featuredStyle: {
    featuredBackground: "linear-gradient(67deg, rgb(0, 0, 0), rgb(18, 57, 57))",
    featuredColor: "white",
    featuredAvatarFilter: ""
  },
  categories: []
};
