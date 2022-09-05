import {
  packagesGet,
  packageInstall,
  packageSetEnvironment,
  packageStartStop
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
 * - graffiti and fee recipient address
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
    stakerConfig.consensusClient &&
    !consClientsAvail.includes(stakerConfig.consensusClient.dnpName)
  )
    throw Error(
      `Invalid consensus client ${stakerConfig.consensusClient} for network ${stakerConfig.network}`
    );

  const pkgs = await packagesGet();

  try {
    // EXECUTION CLIENT
    if (stakerConfig.executionClient)
      await setExecutionClientConfig(
        currentExecClient,
        stakerConfig.executionClient,
        pkgs.find(pkg => pkg.dnpName === stakerConfig.executionClient)
      );

    // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
    if (stakerConfig.consensusClient)
      await setConsensusClientConfig(
        currentConsClient,
        stakerConfig.consensusClient,
        pkgs.find(pkg => pkg.dnpName === stakerConfig.consensusClient?.dnpName)
      );

    // WEB3SIGNER
    if (stakerConfig.enableWeb3signer !== undefined)
      await setWeb3signerConfig(
        stakerConfig.enableWeb3signer,
        web3signerAvail,
        pkgs.find(pkg => pkg.dnpName === web3signerAvail)
      );

    // MEV BOOST
    if (stakerConfig.enableMevBoost !== undefined)
      await setMevBoostConfig(
        stakerConfig.enableMevBoost,
        mevBoostAvail,
        pkgs.find(pkg => pkg.dnpName === mevBoostAvail)
      );
  } catch (e) {
    throw Error(`Error setting staker config: ${e}`);
  } finally {
    // Persist the staker config on db
    setStakerConfigOnDb(stakerConfig.network, stakerConfig);
  }
}

async function setExecutionClientConfig(
  currentExecClient: string,
  executionClient: string,
  execClientPkg: InstalledPackageDataApiReturn | undefined
): Promise<void> {
  // Ensure the EC is installed
  if (currentExecClient === executionClient) {
    logs.info("Execution client is already set to " + executionClient);
    if (execClientPkg) {
      for (const container of execClientPkg.containers) {
        if (!container.running)
          await packageStartStop({
            dnpName: execClientPkg.dnpName,
            serviceNames: [container.serviceName]
          }).catch(e => logs.error(e.message));
      }
    } else {
      logs.info("Installing " + executionClient);
      await packageInstall({ name: executionClient });
    }
  } // If the EC is not installed, install it
  else if (!execClientPkg) {
    // Remove the previous
    /* logs.info("Removing " + currentExecClient);
            await packageRemove({ dnpName: currentExecClient }); */
    // Install the new EC
    logs.info("Installing " + executionClient);
    await packageInstall({ name: executionClient });
  }
}

async function setConsensusClientConfig(
  currentConsClient: string,
  consensusClient: ConsensusClient,
  consClientPkg: InstalledPackageDataApiReturn | undefined
): Promise<void> {
  // User settings object: GRAFFITI, FEE_RECIPIENT_ADDRESS, CHECKPOINTSYNC
  const userSettings: UserSettingsAllDnps = {
    [consensusClient.dnpName]: {
      environment: {
        [getValidatorServiceName(consensusClient.dnpName)]: {
          // Graffiti is a mandatory value
          ["GRAFFITI"]: consensusClient.graffiti || "Validating_from_DAppNode",
          // Fee recipient is a mandatory value
          ["FEE_RECIPIENT_ADDRESS"]:
            consensusClient.feeRecipient ||
            "0x0000000000000000000000000000000000000000",
          // Checkpoint sync is an optional value
          ["CHECKPOINT_SYNC_URL"]: consensusClient.checkpointSync || ""
        }
      }
    }
  };

  // Ensure the CC selected is installed
  if (currentConsClient === consensusClient.dnpName) {
    logs.info("Consensus client is already set to " + consensusClient);
    if (!consClientPkg) {
      logs.info("Installing " + consensusClient);
      await packageInstall({
        name: consensusClient.dnpName,
        userSettings
      });
    } // If the CC is not installed, install it
    else if (
      consensusClient.graffiti ||
      consensusClient.feeRecipient ||
      consensusClient.checkpointSync
    ) {
      const serviceEnv = userSettings[consensusClient.dnpName].environment;

      if (serviceEnv) {
        logs.info("Updating environment for " + consensusClient);
        await packageSetEnvironment({
          dnpName: consensusClient.dnpName,
          environmentByService: serviceEnv
        });
      }
    }
  } // Install the new CC
  else if (!consClientPkg) {
    // Remove the previous
    /*       logs.info("Removing " + currentConsClient);
          await packageRemove({ dnpName: currentConsClient }); */
    // Install the new CC if not already installed
    logs.info("Installing " + consensusClient);
    await packageInstall({
      name: consensusClient.dnpName,
      userSettings
    });
  }
}

async function setWeb3signerConfig(
  enableWeb3signer: boolean,
  web3signerAvail: string,
  web3signerPkg: InstalledPackageDataApiReturn | undefined
): Promise<void> {
  // Web3signer installed and enable => make sure its running
  if (web3signerPkg && enableWeb3signer) {
    logs.info("Web3Signer is already installed");
    for (const container of web3signerPkg.containers) {
      if (!container.running) {
        await packageStartStop({
          dnpName: web3signerPkg.dnpName,
          serviceNames: [container.serviceName]
        }).catch(e => logs.error(e.message));
      }
    }
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
  } // Web3signer not installed and enable => install it
  else if (!web3signerPkg && enableWeb3signer) {
    logs.info("Installing Web3Signer");
    await packageInstall({ name: web3signerAvail });
  }
}

async function setMevBoostConfig(
  enableMevBoost: boolean,
  mevBoostAvail: string,
  mevBoostPkg: InstalledPackageDataApiReturn | undefined
): Promise<void> {
  if (mevBoostPkg) {
    logs.info("MevBoost is already installed");
  } else if (enableMevBoost) {
    // Install mevboost if selected and not installed
    logs.info("Installing MevBoost");
    await packageInstall({ name: mevBoostAvail });
  }
}
