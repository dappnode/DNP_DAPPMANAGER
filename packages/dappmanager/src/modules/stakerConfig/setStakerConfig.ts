import {
  packagesGet,
  packageInstall,
  packageSetEnvironment
} from "../../calls";
import {
  ConsensusClient,
  InstalledPackageData,
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
export async function setStakerConfig({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet;
}): Promise<void> {
  const {
    execClients,
    currentExecClient,
    consClients,
    currentConsClient,
    web3signer,
    mevBoostAvail
  } = getNetworkStakerPkgs(stakerConfig.network);

  // Ensure Execution clients DNP's names are valid
  if (
    stakerConfig.executionClient &&
    !execClients
      .map(exCl => exCl.dnpName)
      .includes(stakerConfig.executionClient)
  )
    throw Error(
      `Invalid execution client ${stakerConfig.executionClient} for network ${stakerConfig.network}`
    );
  // Ensure Consensus clients DNP's names are valid
  if (
    stakerConfig.consensusClient?.dnpName &&
    !consClients
      .map(coCl => coCl.dnpName)
      .includes(stakerConfig.consensusClient.dnpName)
  )
    throw Error(
      `Invalid consensus client ${stakerConfig.consensusClient.dnpName} for network ${stakerConfig.network}`
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
  if (stakerConfig.executionClient !== undefined)
    await setExecutionClientConfig({
      currentExecClient,
      targetExecutionClient: stakerConfig.executionClient,
      currentExecClientPkg
    });

  // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
  if (stakerConfig.consensusClient !== undefined)
    await setConsensusClientConfig({
      currentConsClient,
      targetConsensusClient: stakerConfig.consensusClient,
      currentConsClientPkg
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
      web3signer.dnpName,
      currentWeb3signerPkg
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
  currentExecClientPkg
}: {
  currentExecClient: string;
  targetExecutionClient: string;
  currentExecClientPkg: InstalledPackageDataApiReturn | undefined;
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
  } else if (targetExecutionClient === currentExecClient) {
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
  } else if (targetExecutionClient !== currentExecClient) {
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

async function setConsensusClientConfig({
  currentConsClient,
  targetConsensusClient,
  currentConsClientPkg
}: {
  currentConsClient: string;
  targetConsensusClient: ConsensusClient;
  currentConsClientPkg: InstalledPackageDataApiReturn | undefined;
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

  if (!targetConsensusClient.dnpName && !currentConsClient) {
    // Stop the current consensus client if no option and not current consensus client
    logs.info(`Not consensus client selected`);
    if (currentConsClientPkg) await stopAllPkgContainers(currentConsClientPkg);
  } else if (!targetConsensusClient.dnpName && currentConsClient) {
    // Stop the current consensus client if no target provided
    logs.info(`Not consensus client selected`);
    if (currentConsClientPkg) await stopAllPkgContainers(currentConsClientPkg);
  } else if (targetConsensusClient.dnpName && !currentConsClient) {
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
      // Start new consensus client if not running
      await dockerComposeUpPackage(
        { dnpName: targetConsClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
    }
  } else if (targetConsensusClient.dnpName === currentConsClient) {
    if (!currentConsClientPkg) {
      logs.info("Installing consensus client " + targetConsensusClient);
      await packageInstall({
        name: targetConsensusClient.dnpName,
        userSettings
      });
    } else {
      await dockerComposeUpPackage(
        { dnpName: currentConsClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
      if (
        targetConsensusClient.graffiti ||
        targetConsensusClient.feeRecipient ||
        targetConsensusClient.checkpointSync
      ) {
        const serviceEnv =
          userSettings[targetConsensusClient.dnpName].environment;

        if (serviceEnv) {
          logs.info(
            "Updating environment for " + targetConsensusClient.dnpName
          );
          await packageSetEnvironment({
            dnpName: targetConsensusClient.dnpName,
            environmentByService: serviceEnv
          });
        }
      }
    }
  } else if (targetConsensusClient.dnpName !== currentConsClient) {
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
