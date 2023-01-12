import { packagesGet, packageInstall } from "../../calls";
import {
  ConsensusClient,
  ConsensusClientGnosis,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  ExecutionClient,
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  InstalledPackageDataApiReturn,
  MevBoost,
  MevBoostGnosis,
  MevBoostMainnet,
  MevBoostPrater,
  Network,
  StakerConfigSet,
  StakerItemOk,
  UserSettingsAllDnps
} from "@dappnode/common";
import { logs } from "../../logs";
import { stakerParamsByNetwork } from "./stakerParamsByNetwork";
import {
  getConsensusUserSettings,
  stopAllPkgContainers,
  updateConsensusEnv,
  getMevBoostUserSettings,
  updateMevBoostEnv
} from "./utils";
import { listPackageNoThrow } from "../docker/list/listPackages";
import { dockerComposeUpPackage } from "../docker";
import semver from "semver";
import * as db from "../../db";

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
    mevBoost
  } = stakerParamsByNetwork<T>(stakerConfig.network);

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
      execClient?.minVersion &&
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
      consClient?.minVersion &&
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
    web3signer.minVersion &&
    currentWeb3signerPkg &&
    semver.lt(currentWeb3signerPkg.version, web3signer.minVersion)
  )
    throw Error(
      `Web3signer version ${currentWeb3signerPkg.version} is lower than the minimum version ${web3signer.minVersion} required to work with the stakers UI. Update it to continue.`
    );

  // EXECUTION CLIENT
  await setExecutionClientConfig<T>({
    currentExecClient,
    targetExecutionClient: stakerConfig.executionClient,
    currentExecClientPkg
  });

  // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
  await setConsensusClientConfig<T>({
    currentConsClient,
    targetConsensusClient: stakerConfig.consensusClient,
    currentConsClientPkg
  }).catch(e => {
    // The previous EXECUTION CLIENT must be persisted
    setStakerConfigOnDb<T>({
      network: stakerConfig.network,
      executionClient: currentExecClient,
      consensusClient: stakerConfig.consensusClient?.dnpName,
      mevBoost: stakerConfig.mevBoost?.dnpName
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
        consensusClient: currentConsClient,
        mevBoost: stakerConfig.mevBoost?.dnpName
      });
      throw e;
    });

  // MEV BOOST
  await setMevBoostConfig({
    mevBoost,
    targetMevBoost: stakerConfig.mevBoost,
    currentMevBoostPkg: pkgs.find(pkg => pkg.dnpName === mevBoost)
  }).catch(e => {
    // The previous EXECUTION CLIENT and CONSENSUS CLIENT must be persisted
    setStakerConfigOnDb({
      ...stakerConfig,
      executionClient: currentExecClient,
      consensusClient: currentConsClient,
      mevBoost: stakerConfig.mevBoost?.dnpName
    });
    throw e;
  });

  // Persist the staker config on db
  setStakerConfigOnDb({
    network: stakerConfig.network,
    executionClient: stakerConfig.executionClient?.dnpName,
    consensusClient: stakerConfig.consensusClient?.dnpName,
    mevBoost: stakerConfig.mevBoost?.dnpName
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
  targetExecutionClient?: StakerItemOk<T, "execution">;
  currentExecClientPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  if (!targetExecutionClient?.dnpName && !currentExecClient) {
    // Stop the current execution client if no option and not currentu execution client
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (!targetExecutionClient?.dnpName && currentExecClient) {
    // Stop the current execution client if no target provided
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (targetExecutionClient?.dnpName && !currentExecClient) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient.dnpName
    });
    if (!targetExecClientPkg) {
      // Install new consensus client if not installed
      await packageInstall({ name: targetExecutionClient.dnpName });
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
    targetExecutionClient?.dnpName &&
    targetExecutionClient.dnpName === currentExecClient
  ) {
    if (!currentExecClientPkg) {
      logs.info("Installing execution client " + targetExecutionClient);
      await packageInstall({ name: targetExecutionClient.dnpName });
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
    targetExecutionClient.dnpName !== currentExecClient
  ) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient.dnpName
    });
    if (!targetExecClientPkg) {
      // Install new client if not installed
      await packageInstall({ name: targetExecutionClient.dnpName });
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
  currentConsClientPkg
}: {
  currentConsClient?: T extends "mainnet"
    ? ConsensusClientMainnet
    : T extends "gnosis"
    ? ConsensusClientGnosis
    : ConsensusClientPrater;
  targetConsensusClient?: StakerItemOk<T, "consensus">;
  currentConsClientPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  if (!targetConsensusClient?.dnpName) {
    if (!currentConsClient) {
      // Stop the current consensus client if no option and not current consensus client
      logs.info(`Not consensus client selected`);
      if (currentConsClientPkg)
        await stopAllPkgContainers(currentConsClientPkg);
    } else if (!targetConsensusClient?.dnpName && currentConsClient) {
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
    ...targetConsensusClient
  });

  if (targetConsensusClient.dnpName && !currentConsClient) {
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
  } else if (targetConsensusClient.dnpName === currentConsClient) {
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

async function setMevBoostConfig<T extends Network>({
  mevBoost,
  targetMevBoost,
  currentMevBoostPkg
}: {
  mevBoost: T extends "mainnet"
    ? MevBoostMainnet
    : T extends "gnosis"
    ? MevBoostGnosis
    : MevBoostPrater;
  targetMevBoost?: StakerItemOk<T, "mev-boost">;
  currentMevBoostPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  if (!targetMevBoost?.dnpName) {
    if (!mevBoost) {
      // Stop the mev boost if no option
      logs.info(`Not mev boost selected`);
      if (currentMevBoostPkg) await stopAllPkgContainers(currentMevBoostPkg);
    } else if (!targetMevBoost?.dnpName && mevBoost) {
      // Stop the current mev boost if no target provided
      logs.info(`Not mev boost selected`);
      if (currentMevBoostPkg) await stopAllPkgContainers(currentMevBoostPkg);
    }
    // Return if no mev boost selected
    return;
  }

  // User settings object: RELAYS
  const userSettings: UserSettingsAllDnps = getMevBoostUserSettings({
    targetMevBoost
  });

  // MevBoost installed and enable => make sure its running
  if (currentMevBoostPkg && targetMevBoost.dnpName) {
    logs.info("MevBoost is already installed");
    // Update env if needed
    await updateMevBoostEnv({
      targetMevBoost,
      userSettings
    });
    await dockerComposeUpPackage(
      { dnpName: currentMevBoostPkg.dnpName },
      {},
      {},
      true
    ).catch(err => logs.error(err));
  } // MevBoost installed and disabled => make sure its stopped
  else if (currentMevBoostPkg && !targetMevBoost.dnpName) {
    await stopAllPkgContainers(currentMevBoostPkg);
  } // MevBoost not installed and enable => make sure its installed
  else if (!currentMevBoostPkg && targetMevBoost.dnpName) {
    logs.info("Installing MevBoost");
    await packageInstall({ name: mevBoost, userSettings });
  }
}

/**
 * Sets the staker configuration on db for a given network
 */
function setStakerConfigOnDb<T extends Network>({
  network,
  executionClient,
  consensusClient,
  mevBoost
}: {
  network: T;
  executionClient?: ExecutionClient<T>;
  consensusClient?: ConsensusClient<T>;
  mevBoost?: MevBoost<T>;
}): void {
  switch (network) {
    case "mainnet":
      if (db.executionClientMainnet.get() !== executionClient)
        db.executionClientMainnet.set(
          executionClient as ExecutionClientMainnet
        );
      if (db.consensusClientMainnet.get() !== consensusClient)
        db.consensusClientMainnet.set(
          consensusClient as ConsensusClientMainnet
        );
      if (db.mevBoostMainnet.get() !== Boolean(mevBoost))
        db.mevBoostMainnet.set(mevBoost ? true : false);
      break;
    case "gnosis":
      if (db.executionClientGnosis.get() !== executionClient)
        db.executionClientGnosis.set(executionClient as ExecutionClientGnosis);
      if (db.consensusClientGnosis.get() !== consensusClient)
        db.consensusClientGnosis.set(consensusClient as ConsensusClientGnosis);
      if (db.mevBoostGnosis.get() !== Boolean(mevBoost))
        db.mevBoostGnosis.set(mevBoost ? true : false);
      break;
    case "prater":
      if (db.executionClientPrater.get() !== executionClient)
        db.executionClientPrater.set(executionClient as ExecutionClientPrater);
      if (db.consensusClientPrater.get() !== consensusClient)
        db.consensusClientPrater.set(consensusClient as ConsensusClientPrater);
      if (db.mevBoostPrater.get() !== Boolean(mevBoost))
        db.mevBoostPrater.set(mevBoost ? true : false);
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
