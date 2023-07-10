import {
  ConsensusClient,
  StakerItemOk,
  InstalledPackageData,
  UserSettingsAllDnps
} from "@dappnode/common";
import { packageInstall, packageSetEnvironment } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { listPackageNoThrow } from "../../docker/list/index.js";
import { getConsensusUserSettings } from "../utils.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";
import * as db from "../../../db/index.js";
import {
  ConsensusClientGnosis,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  Network
} from "@dappnode/types";

export async function setConsensusClient<T extends Network>({
  network,
  feeRecipient,
  currentConsensusClient,
  targetConsensusClient,
  currentConsClientPkg,
  isTargetRunning
}: {
  network: Network;
  feeRecipient: string | null;
  currentConsensusClient?: ConsensusClient<T> | null;
  targetConsensusClient?: StakerItemOk<T, "consensus">;
  currentConsClientPkg?: InstalledPackageData;
  isTargetRunning: boolean;
}): Promise<void> {
  await setConsensusClientConfig({
    network,
    feeRecipient,
    currentConsensusClient,
    targetConsensusClient,
    currentConsClientPkg,
    isTargetRunning
  });
  await setConsensusOnDb(network, targetConsensusClient?.dnpName);
}

async function setConsensusClientConfig<T extends Network>({
  network,
  feeRecipient,
  currentConsensusClient,
  targetConsensusClient,
  currentConsClientPkg,
  isTargetRunning
}: {
  network: Network;
  feeRecipient: string | null;
  currentConsensusClient?: ConsensusClient<T> | null;
  targetConsensusClient?: StakerItemOk<T, "consensus">;
  currentConsClientPkg?: InstalledPackageData;
  isTargetRunning: boolean;
}): Promise<void> {
  if (!targetConsensusClient?.dnpName) {
    if (!currentConsensusClient) {
      // Stop the current consensus client if no option and not current consensus client
      logs.info(`Not consensus client selected`);
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    } else if (!targetConsensusClient?.dnpName && currentConsensusClient) {
      // Stop the current consensus client if no target provided
      logs.info(`Not consensus client selected`);
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    }
    // Return if no consensus client is selected
    return;
  }

  // User settings object: GRAFFITI, FEE_RECIPIENT_ADDRESS, CHECKPOINTSYNC
  const userSettings: UserSettingsAllDnps = getConsensusUserSettings({
    dnpName: targetConsensusClient.dnpName,
    network,
    feeRecipient: feeRecipient || "",
    useCheckpointSync: targetConsensusClient.useCheckpointSync
  });

  if (targetConsensusClient.dnpName && !currentConsensusClient) {
    const targetConsClientPkg = await listPackageNoThrow({
      dnpName: targetConsensusClient.dnpName
    });
    if (!targetConsClientPkg) {
      // Install new consensus client if not installed
      await packageInstall({
        name: targetConsensusClient.dnpName,
        userSettings
      });
    } else {
      // Update env if needed
      await updateConsensusEnv({
        targetConsensusClient,
        userSettings
      });
      // Start new consensus client if not running
      if (!isTargetRunning)
        await dockerComposeUpPackage(
          { dnpName: targetConsClientPkg.dnpName },
          {},
          {},
          true
        );
    }
  } else if (targetConsensusClient.dnpName === currentConsensusClient) {
    if (!currentConsClientPkg) {
      logs.info("Installing consensus client " + targetConsensusClient);
      await packageInstall({
        name: targetConsensusClient.dnpName,
        userSettings
      });
    } else {
      // Update env if needed
      await updateConsensusEnv({
        targetConsensusClient,
        userSettings
      });
      // Start package
      if (!isTargetRunning)
        await dockerComposeUpPackage(
          { dnpName: currentConsClientPkg.dnpName },
          {},
          {},
          true
        );
    }
  } else if (targetConsensusClient.dnpName !== currentConsensusClient) {
    const targetConsClientPkg = await listPackageNoThrow({
      dnpName: targetConsensusClient.dnpName
    });
    if (!targetConsClientPkg) {
      // Install new client if not installed
      await packageInstall({
        name: targetConsensusClient.dnpName,
        userSettings
      });
      // Stop old client
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    } else {
      // Update env if needed
      await updateConsensusEnv({
        targetConsensusClient,
        userSettings
      });
      // Start new client
      if (!isTargetRunning)
        await dockerComposeUpPackage(
          { dnpName: targetConsClientPkg.dnpName },
          {},
          {},
          true
        );
      // Stop old client
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    }
  }
}

/**
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setConsensusOnDb<T extends Network>(
  network: T,
  consensusClient?: ConsensusClient<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.consensusClientMainnet.get() !== consensusClient)
        await db.consensusClientMainnet.set(
          consensusClient as ConsensusClientMainnet
        );
      break;
    case "gnosis":
      if (db.consensusClientGnosis.get() !== consensusClient)
        await db.consensusClientGnosis.set(
          consensusClient as ConsensusClientGnosis
        );
      break;
    case "prater":
      if (db.consensusClientPrater.get() !== consensusClient)
        await db.consensusClientPrater.set(
          consensusClient as ConsensusClientPrater
        );
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Sets consensus client environment variables
 * - Sets checkpointsync url to the default or empty string
 * - Sets fee recipient to the default
 */
async function updateConsensusEnv<T extends Network>({
  targetConsensusClient,
  userSettings
}: {
  targetConsensusClient: StakerItemOk<T, "consensus">;
  userSettings: UserSettingsAllDnps;
}): Promise<void> {
  const environmentByService =
    userSettings[targetConsensusClient.dnpName].environment;

  if (environmentByService) {
    logs.info("Updating environment for " + targetConsensusClient.dnpName);
    await packageSetEnvironment({
      dnpName: targetConsensusClient.dnpName,
      environmentByService
    });
  }
}
