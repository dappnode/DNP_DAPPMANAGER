import {
  ConsensusClient,
  StakerItemOk,
  InstalledPackageData,
  Network,
  UserSettingsAllDnps,
} from "@dappnode/common";
import { packageInstall, packageSetEnvironment } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import {
  dockerComposeUpPackage,
  listPackageNoThrow,
} from "@dappnode/dockerapi";
import { getConsensusUserSettings } from "@dappnode/utils";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";

export async function setConsensusClient<T extends Network>({
  network,
  currentConsensusClient,
  targetConsensusClient,
  currentConsClientPkg,
}: {
  network: Network;
  currentConsensusClient?: ConsensusClient<T> | null;
  targetConsensusClient?: StakerItemOk<T, "consensus">;
  currentConsClientPkg?: InstalledPackageData;
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
    useCheckpointSync: targetConsensusClient.useCheckpointSync,
  });

  if (targetConsensusClient.dnpName && !currentConsensusClient) {
    const targetConsClientPkg = await listPackageNoThrow({
      dnpName: targetConsensusClient.dnpName,
    });
    if (!targetConsClientPkg) {
      // Install new consensus client if not installed
      await packageInstall({
        name: targetConsensusClient.dnpName,
        userSettings,
      });
    } else {
      // Update env if needed
      await updateConsensusEnv({
        targetConsensusClient,
        userSettings,
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
        userSettings,
      });
    } else {
      // Update env if needed
      await updateConsensusEnv({
        targetConsensusClient,
        userSettings,
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
      dnpName: targetConsensusClient.dnpName,
    });
    if (!targetExecClientPkg) {
      // Install new client if not installed
      await packageInstall({
        name: targetConsensusClient.dnpName,
        userSettings,
      });
      // Stop old client
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    } else {
      // Update env if needed
      await updateConsensusEnv({
        targetConsensusClient,
        userSettings,
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
 * Sets consensus client environment variables
 * - Sets checkpointsync url to the default or empty string
 * - Sets fee recipient to the default
 */
async function updateConsensusEnv<T extends Network>({
  targetConsensusClient,
  userSettings,
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
      environmentByService,
    });
  }
}
