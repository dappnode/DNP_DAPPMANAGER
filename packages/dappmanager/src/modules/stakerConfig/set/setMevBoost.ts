import {
  StakerItemOk,
  InstalledPackageDataApiReturn,
  UserSettingsAllDnps,
  MevBoost
} from "@dappnode/common";
import { MevBoostMainnet, MevBoostPrater, Network } from "@dappnode/types";
import { packageInstall } from "../../../calls";
import { logs } from "../../../logs";
import { dockerComposeUpPackage } from "../../docker";
import {
  stopAllPkgContainers,
  getMevBoostUserSettings,
  updateMevBoostEnv
} from "../utils";
import * as db from "../../../db/index.js";

export async function setMevBoost<T extends Network>({
  network,
  mevBoost,
  targetMevBoost,
  currentMevBoostPkg
}: {
  network: T;
  mevBoost: T extends "mainnet" ? MevBoostMainnet : MevBoostPrater;
  targetMevBoost?: StakerItemOk<T, "mev-boost">;
  currentMevBoostPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  await setMevBoostConfig({
    mevBoost,
    targetMevBoost,
    currentMevBoostPkg
  });
  await setMevBoostOnDb(network, targetMevBoost?.dnpName);
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
