import { packagesGet, packageInstall } from "../../../calls/index.js";
import {
  ConsensusClient,
  ExecutionClient,
  InstalledPackageDataApiReturn,
  MevBoost,
  Signer,
  StakerConfigSet,
  StakerItemOk,
  UserSettingsAllDnps
} from "@dappnode/common";
import { logs } from "../../../logs.js";
import { getStakerCompatibleVersionsByNetwork } from "../getStakerCompatibleVersionsByNetwork.js";
import {
  getConsensusUserSettings,
  stopAllPkgContainers,
  updateConsensusEnv,
  getMevBoostUserSettings,
  updateMevBoostEnv
} from "../utils.js";
import { listPackageNoThrow } from "../../docker/list/listPackages.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { lt } from "semver";
import * as db from "../../../db/index.js";
import { getLodestarStakersMinimumVersions } from "../params.js";
import { ExecutionClientOrSignerVersions } from "../types.js";
import {
  ExecutionClientMainnet,
  ExecutionClientGnosis,
  ExecutionClientPrater,
  ConsensusClientMainnet,
  ConsensusClientGnosis,
  ConsensusClientPrater,
  MevBoostMainnet,
  MevBoostPrater,
  Network
} from "@dappnode/types";
import { getStakerConfigByNetwork } from "../getStakerConfigByNetwork.js";

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
    compatibleExecution,
    compatibleConsensus,
    compatibleSigner,
    compatibleMevBoost
  } = getStakerCompatibleVersionsByNetwork(stakerConfig.network);

  const {
    executionClient: currentExecutionClient,
    consensusClient: currentConsensusClient,
    feeRecipient,
    isMevBoostSelected
  } = getStakerConfigByNetwork(stakerConfig.network);

  // Ensure Execution clients DNP's names are valid
  if (
    stakerConfig.executionClient &&
    !compatibleExecution
      .map(exCl => exCl.dnpName)
      .includes(stakerConfig.executionClient.dnpName)
  )
    throw Error(
      `Invalid execution client ${stakerConfig.executionClient} for network ${stakerConfig.network}`
    );
  // Ensure Consensus clients DNP's names are valid
  if (
    stakerConfig.consensusClient &&
    !compatibleConsensus
      .map(coCl => coCl.dnpName)
      .includes(stakerConfig.consensusClient.dnpName)
  )
    throw Error(
      `Invalid consensus client ${stakerConfig.consensusClient} for network ${stakerConfig.network}`
    );

  const pkgs = await packagesGet();

  const currentExecClientPkg = pkgs.find(
    pkg => pkg.dnpName === currentExecutionClient
  );
  // Ensure Execution clients DNP's versions names are valid
  if (currentExecClientPkg) {
    const execClient = compatibleExecution.find(
      exCl => exCl.dnpName === currentExecClientPkg.dnpName
    );
    if (
      execClient?.minVersion &&
      lt(currentExecClientPkg.version, execClient.minVersion)
    )
      throw Error(
        `Execution client ${currentExecClientPkg.dnpName} version ${currentExecClientPkg.version} is lower than the minimum version ${execClient.minVersion} required to work with the stakers UI. Update it to continue.`
      );
  }

  const currentConsClientPkg = pkgs.find(
    pkg => pkg.dnpName === currentConsensusClient
  );
  // Ensure Execution clients DNP's versions names are valid
  if (currentConsClientPkg) {
    const consClient = compatibleConsensus.find(
      exCl => exCl.dnpName === currentConsClientPkg.dnpName
    );
    if (
      consClient?.minVersion &&
      lt(currentConsClientPkg.version, consClient.minVersion)
    )
      throw Error(
        `Consensus client ${currentConsClientPkg.dnpName} version ${currentConsClientPkg.version} is lower than the minimum version ${consClient.minVersion} required to work with the stakers UI. Update it to continue.`
      );
  }

  const currentWeb3signerPkg = pkgs.find(
    pkg => pkg.dnpName === compatibleSigner.dnpName
  );
  // Ensure Web3signer DNP's version is valid
  if (
    compatibleSigner.minVersion &&
    currentWeb3signerPkg &&
    lt(currentWeb3signerPkg.version, compatibleSigner.minVersion)
  )
    throw Error(
      `Web3signer version ${currentWeb3signerPkg.version} is lower than the minimum version ${compatibleSigner.minVersion} required to work with the stakers UI. Update it to continue.`
    );

  // If consensus client is lodestar, check that all the execution client and signer versions
  if (
    stakerConfig.executionClient &&
    stakerConfig.consensusClient?.dnpName.includes("lodestar")
  ) {
    checkLodestarMinVersions(
      pkgs,
      stakerConfig.network,
      stakerConfig.executionClient.dnpName,
      stakerConfig.enableWeb3signer,
      compatibleSigner.dnpName,
      currentWeb3signerPkg?.version
    );
  }

  // Set fee recipient on db
  await setFeeRecipientOnDb(stakerConfig.network, stakerConfig.feeRecipient);

  // EXECUTION CLIENT
  await setExecutionClientConfig<T>({
    currentExecutionClient,
    targetExecutionClient: stakerConfig.executionClient,
    currentExecClientPkg
  });
  await setExecutionOnDb(
    stakerConfig.network,
    stakerConfig.executionClient?.dnpName
  );

  // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
  await setConsensusClientConfig<T>({
    network: stakerConfig.network,
    feeRecipient: stakerConfig.feeRecipient,
    currentConsensusClient,
    targetConsensusClient: stakerConfig.consensusClient,
    currentConsClientPkg
  });
  await setConsensusOnDb(
    stakerConfig.network,
    stakerConfig.consensusClient?.dnpName
  );

  // WEB3SIGNER
  if (stakerConfig.enableWeb3signer !== undefined)
    await setWeb3signerConfig(
      stakerConfig.enableWeb3signer,
      compatibleSigner.dnpName,
      currentWeb3signerPkg
    );

  // MEV BOOST
  await setMevBoostConfig({
    mevBoost: compatibleMevBoost,
    targetMevBoost: stakerConfig.mevBoost,
    currentMevBoostPkg: pkgs.find(pkg => pkg.dnpName === compatibleMevBoost)
  });
  await setMevBoostOnDb(stakerConfig.network, stakerConfig.mevBoost?.dnpName);
}

async function setExecutionClientConfig<T extends Network>({
  currentExecutionClient,
  targetExecutionClient,
  currentExecClientPkg
}: {
  currentExecutionClient?: T extends "mainnet"
    ? ExecutionClientMainnet
    : T extends "gnosis"
    ? ExecutionClientGnosis
    : ExecutionClientPrater;
  targetExecutionClient?: StakerItemOk<T, "execution">;
  currentExecClientPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  if (!targetExecutionClient?.dnpName && !currentExecutionClient) {
    // Stop the current execution client if no option and not currentu execution client
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (!targetExecutionClient?.dnpName && currentExecutionClient) {
    // Stop the current execution client if no target provided
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (targetExecutionClient?.dnpName && !currentExecutionClient) {
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
    targetExecutionClient.dnpName === currentExecutionClient
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
    targetExecutionClient.dnpName !== currentExecutionClient
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
  network,
  feeRecipient,
  currentConsensusClient,
  targetConsensusClient,
  currentConsClientPkg
}: {
  network: Network;
  feeRecipient: string;
  currentConsensusClient?: T extends "mainnet"
    ? ConsensusClientMainnet
    : T extends "gnosis"
    ? ConsensusClientGnosis
    : ConsensusClientPrater;
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
    feeRecipient,
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
  mevBoost: T extends "mainnet" ? MevBoostMainnet : MevBoostPrater;
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
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setExecutionOnDb<T extends Network>(
  network: T,
  executionClient?: ExecutionClient<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.executionClientMainnet.get() !== executionClient)
        await db.executionClientMainnet.set(
          executionClient as ExecutionClientMainnet
        );
      break;
    case "gnosis":
      if (db.executionClientGnosis.get() !== executionClient)
        await db.executionClientGnosis.set(
          executionClient as ExecutionClientGnosis
        );
      break;
    case "prater":
      if (db.executionClientPrater.get() !== executionClient)
        await db.executionClientPrater.set(
          executionClient as ExecutionClientPrater
        );
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
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
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setMevBoostOnDb<T extends Network>(
  network: T,
  mevBoost?: MevBoost<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.mevBoostMainnet.get() !== Boolean(mevBoost))
        await db.mevBoostMainnet.set(mevBoost ? true : false);
      break;
    case "gnosis":
      if (db.mevBoostGnosis.get() !== Boolean(mevBoost))
        await db.mevBoostGnosis.set(mevBoost ? true : false);
      break;
    case "prater":
      if (db.mevBoostPrater.get() !== Boolean(mevBoost))
        await db.mevBoostPrater.set(mevBoost ? true : false);
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setFeeRecipientOnDb<T extends Network>(
  network: T,
  feeRecipient?: string
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (
        feeRecipient !== undefined &&
        db.feeRecipientMainnet.get() !== feeRecipient
      )
        await db.feeRecipientMainnet.set(feeRecipient);
      break;
    case "gnosis":
      if (
        feeRecipient !== undefined &&
        db.feeRecipientGnosis.get() !== feeRecipient
      )
        await db.feeRecipientGnosis.set(feeRecipient);
      break;
    case "prater":
      if (
        feeRecipient !== undefined &&
        db.feeRecipientPrater.get() !== feeRecipient
      )
        await db.feeRecipientPrater.set(feeRecipient);
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

function checkLodestarMinVersions<T extends Network>(
  pkgs: InstalledPackageDataApiReturn[],
  network: Network,
  executionClientDnpName: ExecutionClient<T>,
  isSignerSelected: boolean | undefined,
  web3signerDnpName: Signer<T>,
  web3signerVersion: string | undefined
): void {
  const lodestarMinVersions = getLodestarStakersMinimumVersions(
    network
  ) as ExecutionClientOrSignerVersions<T>;

  if (!lodestarMinVersions) {
    throw Error(`Lodestar ${network} minimum versions are not defined.`);
  }

  const installedExecClient = pkgs.find(
    pkg => pkg.dnpName === executionClientDnpName
  );

  const installedExecClientVersion = installedExecClient?.version;

  if (
    installedExecClientVersion &&
    lt(
      installedExecClientVersion,
      lodestarMinVersions[
        executionClientDnpName as keyof ExecutionClientOrSignerVersions<T>
      ]
    )
  ) {
    throw Error(
      `Execution client ${
        installedExecClient.dnpName
      } version ${installedExecClientVersion} is not compatible with Lodestar. 
      Minimum version required: ${
        lodestarMinVersions[
          executionClientDnpName as keyof ExecutionClientOrSignerVersions<T>
        ]
      }`
    );
  }

  if (!isSignerSelected || !web3signerVersion) return;

  if (
    lt(
      web3signerVersion,
      lodestarMinVersions[
        web3signerDnpName as keyof ExecutionClientOrSignerVersions<T>
      ]
    )
  ) {
    throw Error(
      `Signer ${web3signerDnpName} version ${web3signerVersion} is not compatible with Lodestar. 
      Minimum version required: ${
        lodestarMinVersions[
          web3signerDnpName as keyof ExecutionClientOrSignerVersions<T>
        ]
      }`
    );
  }

  logs.debug("All packages are compatible with Lodestar");
}
