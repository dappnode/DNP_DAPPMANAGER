import {
  packagesGet,
  packageInstall,
  packageSetEnvironment
} from "../../calls";
import {
  ConsensusClientGnosis,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  InstalledPackageData,
  InstalledPackageDataApiReturn,
  Network,
  StakerConfigSet,
  UserSettingsAllDnps
} from "../../types";
import { logs } from "../../logs";
import {
  getValidatorServiceName,
  setStakerConfigOnDb,
  getStakerParamsByNetwork,
  getBeaconServiceName
} from "./utils";
import { dockerContainerStop } from "../docker/api";
import { listPackageNoThrow } from "../docker/list/listPackages";
import { dockerComposeUpPackage } from "../docker";
import semver from "semver";

/**
 *  Sets a new staker configuration based on user selection:
 * - New execution client
 * - New consensus client
 * - Install web3signer and/or mevboost
 * - Checkpointsync, graffiti and fee recipient address
 * @param stakerConfig
 * TODO: add option to remove previous or not
 */
export async function setStakerConfig<T extends Network>({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet<T>;
}): Promise<void> {
  const {
    execClients,
    currentExecClient,
    consClients,
    currentConsClient,
    web3signer,
    mevBoostDnpName
  } = getStakerParamsByNetwork<T>(stakerConfig.network);

  if (stakerConfig.network === "mainnet")
    currentConsClient === "lighthouse-prater.dnp.dappnode.eth";

  // Ensure Execution clients DNP's names are valid
  if (
    stakerConfig.executionClient &&
    !execClients
      .map(exCl => exCl.dnpName)
      .includes(stakerConfig.executionClient.dnpName)
  )
    throw Error(
      `Invalid execution client ${stakerConfig.executionClient} for network ${stakerConfig.network}`
    );
  // Ensure Consensus clients DNP's names are valid
  if (
    stakerConfig.consensusClient &&
    !consClients
      .map(coCl => coCl.dnpName)
      .includes(stakerConfig.consensusClient.dnpName)
  )
    throw Error(
      `Invalid consensus client ${stakerConfig.consensusClient} for network ${stakerConfig.network}`
    );

  const pkgs = await packagesGet();

  const currentExecClientPkg = pkgs.find(
    pkg => pkg.dnpName === currentExecClient
  );
  // Ensure Execution clients DNP's versions names are valid
  if (currentExecClientPkg) {
    const execClient = execClients.find(
      exCl => exCl.dnpName === currentExecClientPkg.dnpName
    );
    if (
      execClient &&
      semver.lt(currentExecClientPkg.version, execClient.minVersion)
    )
      throw Error(
        `Execution client ${currentExecClientPkg.dnpName} version ${currentExecClientPkg.version} is lower than the minimum version ${execClient.minVersion} required to work with the stakers UI. Update it to continue.`
      );
  }

  const currentConsClientPkg = pkgs.find(
    pkg => pkg.dnpName === currentConsClient
  );
  // Ensure Execution clients DNP's versions names are valid
  if (currentConsClientPkg) {
    const consClient = consClients.find(
      exCl => exCl.dnpName === currentConsClientPkg.dnpName
    );
    if (
      consClient &&
      semver.lt(currentConsClientPkg.version, consClient.minVersion)
    )
      throw Error(
        `Consensus client ${currentConsClientPkg.dnpName} version ${currentConsClientPkg.version} is lower than the minimum version ${consClient.minVersion} required to work with the stakers UI. Update it to continue.`
      );
  }

  const currentWeb3signerPkg = pkgs.find(
    pkg => pkg.dnpName === web3signer.dnpName
  );
  // Ensure Web3signer DNP's version is valid
  if (
    currentWeb3signerPkg &&
    semver.lt(currentWeb3signerPkg.version, web3signer.minVersion)
  )
    throw Error(
      `Web3signer version ${currentWeb3signerPkg.version} is lower than the minimum version ${web3signer.minVersion} required to work with the stakers UI. Update it to continue.`
    );

  // EXECUTION CLIENT
  await setExecutionClientConfig<T>({
    currentExecClient,
    targetExecutionClient: stakerConfig.executionClient?.dnpName,
    currentExecClientPkg
  });

  // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
  await setConsensusClientConfig<T>({
    currentConsClient,
    targetConsensusClient: stakerConfig.consensusClient?.dnpName,
    currentConsClientPkg
  }).catch(e => {
    // The previous EXECUTION CLIENT must be persisted
    setStakerConfigOnDb<T>({
      network: stakerConfig.network,
      executionClient: currentExecClient,
      consensusClient: stakerConfig.consensusClient?.dnpName,
      enableMevBoost: stakerConfig.enableMevBoost
    });
    throw e;
  });

  // WEB3SIGNER
  if (stakerConfig.enableWeb3signer !== undefined)
    await setWeb3signerConfig(
      stakerConfig.enableWeb3signer,
      web3signer.dnpName,
      currentWeb3signerPkg
    ).catch(e => {
      // The previous EXECUTION CLIENT and CONSENSUS CLIENT must be persisted
      setStakerConfigOnDb({
        ...stakerConfig,
        executionClient: currentExecClient,
        consensusClient: currentConsClient
      });
      throw e;
    });

  // MEV BOOST
  if (stakerConfig.enableMevBoost !== undefined)
    await setMevBoostConfig(
      stakerConfig.enableMevBoost,
      mevBoostDnpName,
      pkgs.find(pkg => pkg.dnpName === mevBoostDnpName)
    ).catch(e => {
      // The previous EXECUTION CLIENT and CONSENSUS CLIENT must be persisted
      setStakerConfigOnDb({
        ...stakerConfig,
        executionClient: currentExecClient,
        consensusClient: currentConsClient
      });
      throw e;
    });

  // Persist the staker config on db
  setStakerConfigOnDb({
    network: stakerConfig.network,
    executionClient: stakerConfig.executionClient?.dnpName,
    consensusClient: stakerConfig.consensusClient?.dnpName,
    enableMevBoost: stakerConfig.enableMevBoost
  });
}

async function setExecutionClientConfig<T extends Network>({
  currentExecClient,
  targetExecutionClient,
  currentExecClientPkg
}: {
  currentExecClient?: T extends "mainnet"
    ? ExecutionClientMainnet
    : T extends "gnosis"
    ? ExecutionClientGnosis
    : ExecutionClientPrater;
  targetExecutionClient?: T extends "mainnet"
    ? ExecutionClientMainnet
    : T extends "gnosis"
    ? ExecutionClientGnosis
    : ExecutionClientPrater;
  currentExecClientPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  if (!targetExecutionClient && !currentExecClient) {
    // Stop the current execution client if no option and not currentu execution client
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (!targetExecutionClient && currentExecClient) {
    // Stop the current execution client if no target provided
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (targetExecutionClient && !currentExecClient) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient
    });
    if (!targetExecClientPkg) {
      // Install new consensus client if not installed
      await packageInstall({ name: targetExecutionClient });
    } else {
      // Start new consensus client if not running
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
    }
  } else if (
    targetExecutionClient &&
    targetExecutionClient === currentExecClient
  ) {
    if (!currentExecClientPkg) {
      logs.info("Installing execution client " + targetExecutionClient);
      await packageInstall({ name: targetExecutionClient });
    } else {
      await dockerComposeUpPackage(
        { dnpName: currentExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
    }
  } else if (
    targetExecutionClient &&
    targetExecutionClient !== currentExecClient
  ) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient
    });
    if (!targetExecClientPkg) {
      // Install new client if not installed
      await packageInstall({ name: targetExecutionClient });
      // Stop old client
      if (currentExecClientPkg)
        await stopAllPkgContainers(currentExecClientPkg);
    } else {
      // Start new client
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
      // Stop old client
      if (currentExecClientPkg)
        await stopAllPkgContainers(currentExecClientPkg);
    }
  }
}

async function setConsensusClientConfig<T extends Network>({
  currentConsClient,
  targetConsensusClient,
  currentConsClientPkg,
  targetGraffiti,
  targetFeeRecipient,
  targetCheckpointSync
}: {
  currentConsClient?: T extends "mainnet"
    ? ConsensusClientMainnet
    : T extends "gnosis"
    ? ConsensusClientGnosis
    : ConsensusClientPrater;
  targetConsensusClient?: T extends "mainnet"
    ? ConsensusClientMainnet
    : T extends "gnosis"
    ? ConsensusClientGnosis
    : ConsensusClientPrater;
  currentConsClientPkg?: InstalledPackageDataApiReturn;
  targetGraffiti?: string;
  targetFeeRecipient?: string;
  targetCheckpointSync?: string;
}): Promise<void> {
  if (!targetConsensusClient) {
    if (!currentConsClient) {
      // Stop the current consensus client if no option and not current consensus client
      logs.info(`Not consensus client selected`);
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    } else if (!targetConsensusClient && currentConsClient) {
      // Stop the current consensus client if no target provided
      logs.info(`Not consensus client selected`);
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    }
    // Return if no consensus client is selected
    return;
  }
  // User settings object: GRAFFITI, FEE_RECIPIENT_ADDRESS, CHECKPOINTSYNC
  const validatorServiceName = getValidatorServiceName(targetConsensusClient);
  const beaconServiceName = getBeaconServiceName(targetConsensusClient);
  const userSettings: UserSettingsAllDnps = getUserSettings({
    targetConsensusClient,
    validatorServiceName,
    beaconServiceName,
    targetGraffiti,
    targetFeeRecipient,
    targetCheckpointSync
  });

  if (targetConsensusClient && !currentConsClient) {
    const targetConsClientPkg = await listPackageNoThrow({
      dnpName: targetConsensusClient
    });
    if (!targetConsClientPkg) {
      // Install new consensus client if not installed
      await packageInstall({
        name: targetConsensusClient,
        userSettings
      });
    } else {
      // Start new consensus client if not running
      await dockerComposeUpPackage(
        { dnpName: targetConsClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
    }
  } else if (targetConsensusClient === currentConsClient) {
    if (!currentConsClientPkg) {
      logs.info("Installing consensus client " + targetConsensusClient);
      await packageInstall({
        name: targetConsensusClient,
        userSettings
      });
    } else {
      await dockerComposeUpPackage(
        { dnpName: currentConsClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
      if (targetGraffiti || targetFeeRecipient || targetCheckpointSync) {
        const serviceEnv = userSettings[targetConsensusClient].environment;

        if (serviceEnv) {
          logs.info("Updating environment for " + targetConsensusClient);
          await packageSetEnvironment({
            dnpName: targetConsensusClient,
            environmentByService: serviceEnv
          });
        }
      }
    }
  } else if (targetConsensusClient !== currentConsClient) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetConsensusClient
    });
    if (!targetExecClientPkg) {
      // Install new client if not installed
      await packageInstall({
        name: targetConsensusClient,
        userSettings
      });
      // Stop old client
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    } else {
      // Start new client
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
      // Stop old client
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
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
    await dockerComposeUpPackage(
      { dnpName: web3signerPkg.dnpName },
      {},
      {},
      true
    ).catch(err => logs.error(err));
  } // Web3signer installed and disabled => make sure its stopped
  else if (web3signerPkg && !enableWeb3signer) {
    await stopAllPkgContainers(web3signerPkg);
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
    await dockerComposeUpPackage(
      { dnpName: mevBoostPkg.dnpName },
      {},
      {},
      true
    ).catch(err => logs.error(err));
  } // MevBoost installed and disabled => make sure its stopped
  else if (mevBoostPkg && !enableMevBoost) {
    await stopAllPkgContainers(mevBoostPkg);
  } // MevBoost not installed and enable => make sure its installed
  else if (!mevBoostPkg && enableMevBoost) {
    logs.info("Installing MevBoost");
    await packageInstall({ name: mevBoostDnpName });
  }
}

async function stopAllPkgContainers(
  pkg: InstalledPackageDataApiReturn | InstalledPackageData
): Promise<void> {
  await Promise.all(
    pkg.containers
      .filter(c => c.running)
      .map(async c =>
        dockerContainerStop(c.containerName, { timeout: c.dockerTimeout })
      )
  ).catch(e => logs.error(e.message));
}

/**
 * Get the user settings for the consensus client.
 * It may be different depending if it is multiservice or monoservice and all the envs are
 * set in the same service
 */
function getUserSettings({
  targetConsensusClient,
  validatorServiceName,
  beaconServiceName,
  targetGraffiti,
  targetFeeRecipient,
  targetCheckpointSync
}: {
  targetConsensusClient:
    | ConsensusClientMainnet
    | ConsensusClientGnosis
    | ConsensusClientPrater;
  validatorServiceName: string;
  beaconServiceName: string;
  targetGraffiti?: string;
  targetFeeRecipient?: string;
  targetCheckpointSync?: string;
}): UserSettingsAllDnps {
  return {
    [targetConsensusClient]: {
      environment:
        beaconServiceName === validatorServiceName
          ? {
              [validatorServiceName]: {
                // Graffiti is a mandatory value
                ["GRAFFITI"]: targetGraffiti || "Validating_from_DAppNode",
                // Fee recipient is a mandatory value
                ["FEE_RECIPIENT_ADDRESS"]:
                  targetFeeRecipient ||
                  "0x0000000000000000000000000000000000000000",
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: targetCheckpointSync || ""
              }
            }
          : {
              [validatorServiceName]: {
                // Graffiti is a mandatory value
                ["GRAFFITI"]: targetGraffiti || "Validating_from_DAppNode",
                // Fee recipient is a mandatory value
                ["FEE_RECIPIENT_ADDRESS"]:
                  targetFeeRecipient ||
                  "0x0000000000000000000000000000000000000000"
              },

              [beaconServiceName]: {
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: targetCheckpointSync || ""
              }
            }
    }
  };
}
