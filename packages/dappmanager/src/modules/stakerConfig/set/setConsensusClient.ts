import {
  ConsensusClient,
  StakerItemOk,
  InstalledPackageDataApiReturn,
  UserSettingsAllDnps
} from "@dappnode/common";
import { packageInstall } from "../../../calls";
import { logs } from "../../../logs";
import { dockerComposeUpPackage } from "../../docker";
import { listPackageNoThrow } from "../../docker/list";
import {
  stopAllPkgContainers,
  getConsensusUserSettings,
  updateConsensusEnv
} from "../utils";
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
  currentConsClientPkg
}: {
  network: Network;
  feeRecipient: string | null;
  currentConsensusClient?: ConsensusClient<T> | null;
  targetConsensusClient?: StakerItemOk<T, "consensus">;
  currentConsClientPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  await setConsensusClientConfig({
    network,
    feeRecipient,
    currentConsensusClient,
    targetConsensusClient,
    currentConsClientPkg
  });
  await setConsensusOnDb(network, targetConsensusClient?.dnpName);
}

async function setConsensusClientConfig<T extends Network>({
  network,
  feeRecipient,
  currentConsensusClient,
  targetConsensusClient,
  currentConsClientPkg
}: {
  network: Network;
  feeRecipient: string | null;
  currentConsensusClient?: ConsensusClient<T> | null;
  targetConsensusClient?: StakerItemOk<T, "consensus">;
  currentConsClientPkg?: InstalledPackageDataApiReturn;
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
      await dockerComposeUpPackage(
        { dnpName: currentConsClientPkg.dnpName },
        {},
        {},
        true
      );
    }
  } else if (targetConsensusClient.dnpName !== currentConsensusClient) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetConsensusClient.dnpName
    });
    if (!targetExecClientPkg) {
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
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
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
