import {
  Network,
  UserSettingsAllDnps,
  InstalledPackageData,
  InstalledPackageDataApiReturn,
  StakerItemOk,
  StakerItemData,
  PackageRelease
} from "@dappnode/common";
import * as db from "../../db";
import { packageSetEnvironment } from "../../calls";
import { logs } from "../../logs";
import { dockerContainerStop } from "../docker";
import { pick } from "lodash-es";
import { Manifest } from "@dappnode/dappnodesdk";
import { ReleaseFetcher } from "../release";
import { eventBus } from "../../eventBus";

/**
 * Get the validator service name.
 * - Nimbus package is monoservice (beacon-validator)
 * - Prysm, Teku, Lighthouse are multiservice (beacon, validator)
 */
export function getValidatorServiceName(dnpName: string): string {
  return dnpName.includes("nimbus") ? "beacon-validator" : "validator";
}

/**
 * Get the beacon service name
 * - Nimbus package is monoservice (beacon-validator)
 * - Prysm, Teku, Lighthouse are multiservice (beacon, validator)
 */
export function getBeaconServiceName(dnpName: string): string {
  return dnpName.includes("nimbus") ? "beacon-validator" : "beacon-chain";
}

/**
 * Stop all the containers from a given package dnpName
 */
export async function stopAllPkgContainers(
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
export function getConsensusUserSettings({
  dnpName,
  graffiti,
  feeRecipient,
  checkpointSync
}: {
  dnpName: string;
  graffiti?: string;
  feeRecipient?: string;
  checkpointSync?: string;
}): UserSettingsAllDnps {
  const validatorServiceName = getValidatorServiceName(dnpName);
  const beaconServiceName = getBeaconServiceName(dnpName);
  return {
    [dnpName]: {
      environment:
        beaconServiceName === validatorServiceName
          ? {
              [validatorServiceName]: {
                // Graffiti is a mandatory value
                ["GRAFFITI"]: graffiti || "Validating_from_DAppNode",
                // Fee recipient is a mandatory value
                ["FEE_RECIPIENT_ADDRESS"]:
                  feeRecipient || "0x0000000000000000000000000000000000000000",
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: checkpointSync || ""
              }
            }
          : {
              [validatorServiceName]: {
                // Graffiti is a mandatory value
                ["GRAFFITI"]: graffiti || "Validating_from_DAppNode",
                // Fee recipient is a mandatory value
                ["FEE_RECIPIENT_ADDRESS"]:
                  feeRecipient || "0x0000000000000000000000000000000000000000"
              },

              [beaconServiceName]: {
                // Fee recipient is a mandatory vlaue (for Teku)
                ["FEE_RECIPIENT_ADDRESS"]:
                  feeRecipient || "0x0000000000000000000000000000000000000000",
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: checkpointSync || ""
              }
            }
    }
  };
}

/**
 * Update environemnt variables for the consensus client
 * only if graffiti, fee recipient or checkpoint sync are set
 */
export async function updateConsensusEnv<T extends Network>({
  targetConsensusClient,
  userSettings
}: {
  targetConsensusClient: StakerItemOk<T, "consensus">;
  userSettings: UserSettingsAllDnps;
}): Promise<void> {
  if (
    targetConsensusClient.graffiti ||
    targetConsensusClient.feeRecipient ||
    targetConsensusClient.checkpointSync
  ) {
    const serviceEnv = userSettings[targetConsensusClient.dnpName].environment;

    if (serviceEnv) {
      logs.info("Updating environment for " + targetConsensusClient.dnpName);
      await packageSetEnvironment({
        dnpName: targetConsensusClient.dnpName,
        environmentByService: serviceEnv
      });
    }
  }
}

/**
 * Get the user settings for the mev boost
 */
export function getMevBoostUserSettings<T extends Network>({
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

/**
 * Update environemnt variables for the mev boost
 * only if relays are set
 */
export async function updateMevBoostEnv<T extends Network>({
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

export function getIsRunning(
  { dnpName }: { dnpName: string },
  dnpList: InstalledPackageData[]
): boolean {
  return (
    dnpList
      .find(dnp => dnp.dnpName === dnpName)
      ?.containers.every(c => c.running) ?? false
  );
}

export async function getPkgData(
  releaseFetcher: ReleaseFetcher,
  dnpName: string
): Promise<StakerItemData> {
  const cachedDnp = db.stakerItemMetadata.get(dnpName);
  if (cachedDnp) {
    // Update cache in the background
    eventBus.runStakerCacheUpdate.emit({ dnpName });
    return cachedDnp;
  } else {
    const repository = await releaseFetcher.getRelease(dnpName);
    const dataDnp = pickStakerItemData(repository);
    db.stakerItemMetadata.set(dnpName, dataDnp);
    return dataDnp;
  }
}

export function pickStakerItemData(pkgRelease: PackageRelease): StakerItemData {
  return {
    metadata: pickStakerManifestData(pkgRelease.metadata),
    ...pick(pkgRelease, [
      "dnpName",
      "reqVersion",
      "semVersion",
      "imageFile",
      "avatarFile",
      "warnings",
      "origin",
      "signedSafe"
    ] as const)
  };
}

function pickStakerManifestData(manifest: Manifest): Manifest {
  return pick(manifest, [
    "name",
    "version",
    "shortDescription",
    "avatar",
    "links",
    "chain",
    "warnings"
  ] as const);
}
