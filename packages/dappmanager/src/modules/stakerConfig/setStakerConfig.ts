import {
  packagesGet,
  packageInstall,
  packageSetEnvironment,
  packageStartStop,
  packageRestart
} from "../../calls";
import {
  ConsensusClient,
  InstalledPackageDataApiReturn,
  StakerConfigSet,
  UserSettingsAllDnps
} from "../../types";
import { logs } from "../../logs";
import {
  getValidatorServiceName,
  setStakerConfigOnDb,
  getNetworkStakerPkgs
} from "./utils";

/**
 *  Sets a new staker configuration based on user selection:
 * - New execution client
 * - New consensus client
 * - Install web3signer and/or mevboost
 * - Checkpointsync, graffiti and fee recipient address
 * @param stakerConfig
 * TODO: add option to remove previous or not
 */
export async function setStakerConfig({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet;
}): Promise<void> {
  const {
    execClientsAvail,
    currentExecClient,
    consClientsAvail,
    currentConsClient,
    web3signerAvail,
    mevBoostAvail
  } = getNetworkStakerPkgs(stakerConfig.network);

  // Ensure Execution clients DNP's names are valid
  if (
    stakerConfig.executionClient &&
    !execClientsAvail.includes(stakerConfig.executionClient)
  )
    throw Error(
      `Invalid execution client ${stakerConfig.executionClient} for network ${stakerConfig.network}`
    );
  // Ensure Consensus clients DNP's names are valid
  if (
    stakerConfig.consensusClient?.dnpName &&
    !consClientsAvail.includes(stakerConfig.consensusClient.dnpName)
  )
    throw Error(
      `Invalid consensus client ${stakerConfig.consensusClient.dnpName} for network ${stakerConfig.network}`
    );

  const pkgs = await packagesGet();

  // EXECUTION CLIENT
  if (stakerConfig.executionClient !== undefined)
    await setExecutionClientConfig({
      currentExecClient,
      targetExecutionClient: stakerConfig.executionClient,
      execClientPkg: pkgs.find(
        pkg => pkg.dnpName === stakerConfig.executionClient
      )
    });

  // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
  if (stakerConfig.consensusClient !== undefined)
    await setConsensusClientConfig({
      currentConsClient,
      targetConsensusClient: stakerConfig.consensusClient,
      consClientPkg: pkgs.find(
        pkg => pkg.dnpName === stakerConfig.consensusClient?.dnpName
      )
    }).catch(e => {
      // The previous EXECUTION CLIENT must be persisted
      setStakerConfigOnDb({
        ...stakerConfig,
        executionClient: currentExecClient
      });
      throw e;
    });

  // WEB3SIGNER
  if (stakerConfig.enableWeb3signer !== undefined)
    await setWeb3signerConfig(
      stakerConfig.enableWeb3signer,
      web3signerAvail,
      pkgs.find(pkg => pkg.dnpName === web3signerAvail)
    ).catch(e => {
      // The previous EXECUTION CLIENT and CONSENSUS CLIENT must be persisted
      setStakerConfigOnDb({
        ...stakerConfig,
        executionClient: currentExecClient,
        consensusClient: { dnpName: currentConsClient }
      });
      throw e;
    });

  // MEV BOOST
  if (stakerConfig.enableMevBoost !== undefined)
    await setMevBoostConfig(
      stakerConfig.enableMevBoost,
      mevBoostAvail,
      pkgs.find(pkg => pkg.dnpName === mevBoostAvail)
    ).catch(e => {
      // The previous EXECUTION CLIENT and CONSENSUS CLIENT must be persisted
      setStakerConfigOnDb({
        ...stakerConfig,
        executionClient: currentExecClient,
        consensusClient: { dnpName: currentConsClient }
      });
      throw e;
    });

  // Persist the staker config on db
  setStakerConfigOnDb(stakerConfig);
}

async function setExecutionClientConfig({
  currentExecClient,
  targetExecutionClient,
  execClientPkg
}: {
  currentExecClient: string;
  targetExecutionClient: string;
  execClientPkg: InstalledPackageDataApiReturn | undefined;
}): Promise<void> {
  // If the EC is not installed, install it
  if (!execClientPkg) {
    logs.info("Installing " + targetExecutionClient);
    await packageInstall({ name: targetExecutionClient });
  } // Stop the current execution client if no target provided
  else if (!targetExecutionClient) {
    for (const container of execClientPkg.containers) {
      if (container.running)
        await packageStartStop({
          dnpName: execClientPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
    }
  }
  // Ensure the EC selected is running
  else if (currentExecClient === targetExecutionClient) {
    logs.info("Execution client is already set to " + targetExecutionClient);
    for (const container of execClientPkg.containers) {
      if (!container.running)
        await packageStartStop({
          dnpName: execClientPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
    }
  }
}

async function setConsensusClientConfig({
  currentConsClient,
  targetConsensusClient,
  consClientPkg
}: {
  currentConsClient: string;
  targetConsensusClient: ConsensusClient;
  consClientPkg: InstalledPackageDataApiReturn | undefined;
}): Promise<void> {
  // User settings object: GRAFFITI, FEE_RECIPIENT_ADDRESS, CHECKPOINTSYNC
  const userSettings: UserSettingsAllDnps = {
    [targetConsensusClient.dnpName]: {
      environment: {
        [getValidatorServiceName(targetConsensusClient.dnpName)]: {
          // Graffiti is a mandatory value
          ["GRAFFITI"]:
            targetConsensusClient.graffiti || "Validating_from_DAppNode",
          // Fee recipient is a mandatory value
          ["FEE_RECIPIENT_ADDRESS"]:
            targetConsensusClient.feeRecipient ||
            "0x0000000000000000000000000000000000000000",
          // Checkpoint sync is an optional value
          ["CHECKPOINT_SYNC_URL"]: targetConsensusClient.checkpointSync || ""
        }
      }
    }
  };

  // Install the new CC
  if (!consClientPkg) {
    // Install the new CC if not already installed
    logs.info("Installing " + targetConsensusClient);
    await packageInstall({
      name: targetConsensusClient.dnpName,
      userSettings
    });
    // Stop the current consensus client if no target provided
  } else if (!targetConsensusClient.dnpName) {
    for (const container of consClientPkg.containers) {
      if (container.running)
        await packageStartStop({
          dnpName: consClientPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
    }
  } // Ensure the CC selected is installed and running and set the user settings
  else if (currentConsClient === targetConsensusClient.dnpName) {
    logs.info("Consensus client is already set to " + targetConsensusClient);
    for (const container of consClientPkg.containers) {
      if (!container.running)
        await packageStartStop({
          dnpName: consClientPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
    }
    if (
      targetConsensusClient.graffiti ||
      targetConsensusClient.feeRecipient ||
      targetConsensusClient.checkpointSync
    ) {
      const serviceEnv =
        userSettings[targetConsensusClient.dnpName].environment;

      if (serviceEnv) {
        logs.info("Updating environment for " + targetConsensusClient.dnpName);
        await packageSetEnvironment({
          dnpName: targetConsensusClient.dnpName,
          environmentByService: serviceEnv
        });
      }
    }
  }
}

async function setWeb3signerConfig(
  enableWeb3signer: boolean,
  web3signerDnpName: string,
  web3signerPkg: InstalledPackageDataApiReturn | undefined
): Promise<void> {
  // Web3signer installed and enable => make sure its running
  if (web3signerPkg && enableWeb3signer) {
    logs.info("Web3Signer is already installed");
    if (web3signerPkg.containers.some(container => !container.running))
      await packageRestart({ dnpName: web3signerPkg.dnpName }).catch(e =>
        logs.error(e.message)
      );
  } // Web3signer installed and disabled => make sure its stopped
  else if (web3signerPkg && !enableWeb3signer) {
    for (const container of web3signerPkg.containers) {
      if (container.running) {
        await packageStartStop({
          dnpName: web3signerPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
      }
    }
  } // Web3signer not installed and enable => make sure its installed
  else if (!web3signerPkg && enableWeb3signer) {
    logs.info("Installing Web3Signer");
    await packageInstall({ name: web3signerDnpName });
  }
}

async function setMevBoostConfig(
  enableMevBoost: boolean,
  mevBoostDnpName: string,
  mevBoostPkg: InstalledPackageDataApiReturn | undefined
): Promise<void> {
  // MevBoost installed and enable => make sure its running
  if (mevBoostPkg && enableMevBoost) {
    logs.info("MevBoost is already installed");
    for (const container of mevBoostPkg.containers) {
      if (!container.running) {
        await packageStartStop({
          dnpName: mevBoostPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
      }
    }
  } // MevBoost installed and disabled => make sure its stopped
  else if (mevBoostPkg && !enableMevBoost) {
    for (const container of mevBoostPkg.containers) {
      if (container.running) {
        await packageStartStop({
          dnpName: mevBoostPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
      }
    }
  } // MevBoost not installed and enable => make sure its installed
  else if (!mevBoostPkg && enableMevBoost) {
    logs.info("Installing MevBoost");
    await packageInstall({ name: mevBoostDnpName });
  }
}
