import {
  StakerItemOk,
  InstalledPackageDataApiReturn,
  UserSettingsAllDnps,
} from "@dappnode/common";
import { MevBoostMainnet, MevBoostPrater, Network } from "@dappnode/types";
import { packageInstall, packageSetEnvironment } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";

export async function setMevBoost<T extends Network>({
  mevBoost,
  targetMevBoost,
  currentMevBoostPkg
}: {
  network: T;
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
 * Update environemnt variables for the mev boost
 * only if relays are set
 */
async function updateMevBoostEnv<T extends Network>({
  targetMevBoost,
  userSettings
}: {
  targetMevBoost: StakerItemOk<T, "mev-boost">;
  userSettings: UserSettingsAllDnps;
}): Promise<void> {
  if (targetMevBoost.relays) {
    const serviceEnv = userSettings[targetMevBoost.dnpName].environment;

    if (serviceEnv) {
      logs.info("Updating environment for " + targetMevBoost.dnpName);
      await packageSetEnvironment({
        dnpName: targetMevBoost.dnpName,
        environmentByService: serviceEnv
      });
    }
  }
}

/**
 * Get the user settings for the mev boost
 */
function getMevBoostUserSettings<T extends Network>({
  targetMevBoost
}: {
  targetMevBoost: StakerItemOk<T, "mev-boost">;
}): UserSettingsAllDnps {
  return {
    [targetMevBoost.dnpName]: {
      environment: {
        "mev-boost": {
          ["RELAYS"]:
            targetMevBoost.relays
              ?.join(",")
              .trim()
              .replace(/(^,)|(,$)/g, "") || ""
        }
      }
    }
  };
}
