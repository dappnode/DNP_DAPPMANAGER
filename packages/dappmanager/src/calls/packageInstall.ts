import { Network, Routes } from "@dappnode/types";
import { packageInstall as pkgInstall } from "@dappnode/installer";
import { dappnodeInstaller } from "../index.js";
import { Consensus } from "@dappnode/stakers";
import { logs } from "@dappnode/logger";

/**
 * Installs a DAppNode Package.
 * Resolves dependencies, downloads release assets, loads the images to docker,
 * sets userSettings and starts the docker container for each package.
 *
 * The logId is the requested id. It is used for the UI to track the progress
 * of the installation in real time and prevent double installs
 *
 * Options
 * - BYPASS_RESOLVER {bool}: Skips dappGet to only fetche first level dependencies
 * - BYPASS_CORE_RESTRICTION {bool}: Allows unverified core DNPs (from IPFS)
 */
export async function packageInstall({
  name: reqName,
  version: reqVersion,
  userSettings = {},
  options = {}
}: Parameters<Routes["packageInstall"]>[0]): Promise<void> {
  await pkgInstall(dappnodeInstaller, {
    name: reqName,
    version: reqVersion,
    userSettings,
    options
  });

  await ensureNimbusConnection(reqName);
}

/**
 * Nimbus package will be migrated from a monoservice to a multiservice package.
 * beacon-validator will be split into beacon-chain and validator services.
 *
 * This function ensures both services are properly connected to the staker network
 * after installing the new version.
 *
 * TODO: Remove this once all Nimbus packages are multiservice
 */
async function ensureNimbusConnection(dnpName: string): Promise<void> {
  if (!dnpName.includes("nimbus")) {
    logs.debug("Not a Nimbus package, skipping network reconnection");
    return;
  }

  logs.info("Ensuring Nimbus services are connected to the staker network");

  const consensus: Consensus = new Consensus(dappnodeInstaller);

  const nimbusNetwork: Record<string, Network> = {
    "nimbus.dnp.dappnode.eth": Network.Mainnet,
    "nimbus-prater.dnp.dappnode.eth": Network.Prater,
    "nimbus-gnosis.dnp.dappnode.eth": Network.Gnosis,
    "nimbus-holesky.dnp.dappnode.eth": Network.Holesky,
    "nimbus-hoodi.dnp.dappnode.eth": Network.Hoodi, // Remove all networks unless nimbus-gnosis? (still monoserivce) 
  };

  const network = nimbusNetwork[dnpName];

  if (!network) {
    logs.error("Could not determine the network for the Nimbus package");
    return;
  }

  // Not awaited
  await consensus.persistSelectedConsensusIfInstalled(network);
}
