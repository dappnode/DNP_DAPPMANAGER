import {
  Network,
  UserSettingsAllDnps,
  InstalledPackageData,
  InstalledPackageDataApiReturn,
  StakerItemOk,
  StakerItemData,
  PackageRelease
} from "@dappnode/common";
import * as db from "../../db/index.js";
import { packageSetEnvironment } from "../../calls/index.js";
import { logs } from "../../logs.js";
import { dockerContainerStop } from "../docker/index.js";
import { pick } from "lodash-es";
import { Manifest } from "@dappnode/types";
import { ReleaseFetcher } from "../release/index.js";
import { eventBus } from "../../eventBus.js";

/**
 * Get the validator service name.
 * - Nimbus package is monoservice (beacon-validator)
 * - Prysm, Teku, Lighthouse, and Lodestar are multiservice (beacon, validator)
 */
export function getValidatorServiceName(dnpName: string): string {
  return dnpName.includes("nimbus") ? "beacon-validator" : "validator";
}

/**
 * Get the beacon service name
 * - Nimbus package is monoservice (beacon-validator)
 * - Prysm, Teku, Lighthouse, and Lodestar are multiservice (beacon, validator)
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
  network,
  feeRecipient,
  useCheckpointSync
}: {
  dnpName: string;
  network: Network;
  feeRecipient: string;
  useCheckpointSync?: boolean;
}): UserSettingsAllDnps {
  const validatorServiceName = getValidatorServiceName(dnpName);
  const beaconServiceName = getBeaconServiceName(dnpName);
  const defaultDappnodeGraffiti = "validating_from_DAppNode";
  const defaultFeeRecipient = "0x0000000000000000000000000000000000000000";
  return {
    [dnpName]: {
      environment:
        beaconServiceName === validatorServiceName
          ? {
              [validatorServiceName]: {
                // Fee recipient is set as global env, keep this for backwards compatibility
                ["FEE_RECIPIENT_ADDRESS"]: feeRecipient || defaultFeeRecipient,
                // Graffiti is a mandatory value
                ["GRAFFITI"]: defaultDappnodeGraffiti,
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: useCheckpointSync
                  ? getDefaultCheckpointSync(network)
                  : ""
              }
            }
          : {
              [validatorServiceName]: {
                // Fee recipient is set as global env, keep this for backwards compatibility
                ["FEE_RECIPIENT_ADDRESS"]: feeRecipient || defaultFeeRecipient,
                // Graffiti is a mandatory value
                ["GRAFFITI"]: defaultDappnodeGraffiti
              },

              [beaconServiceName]: {
                // Fee recipient is set as global env, keep this for backwards compatibility
                ["FEE_RECIPIENT_ADDRESS"]: feeRecipient || defaultFeeRecipient,
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: useCheckpointSync
                  ? getDefaultCheckpointSync(network)
                  : ""
              }
            }
    }
  };
}

export const getDefaultCheckpointSync = (network: Network): string =>
  network === "mainnet"
    ? "https://checkpoint-sync.dappnode.io"
    : network === "prater"
    ? "https://checkpoint-sync-prater.dappnode.io"
    : network === "gnosis"
    ? "https://checkpoint-sync-gnosis.dappnode.io"
    : "";

/**
 * Sets consensus client environment variables
 * - Sets checkpointsync url to the default or empty string
 * - Sets fee recipient to the default
 */
export async function updateConsensusEnv<T extends Network>({
  targetConsensusClient,
  userSettings
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
      environmentByService
    });
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

/**
 * Returns true if the package is running or false if not
 * For web3signer, it does not take into account the container "flyway" which may not be running
 */
export function getIsRunning(
  { dnpName }: { dnpName: string },
  dnpList: InstalledPackageData[]
): boolean {
  const flywayServiceName = "flyway";
  const isSigner = dnpName.includes("web3signer");
  const dnp = dnpList.find(dnp => dnp.dnpName === dnpName);
  if (dnp) {
    if (isSigner)
      return dnp.containers
        .filter(c => c.serviceName !== flywayServiceName)
        .every(c => c.running);
    else return dnp.containers.every(c => c.running);
  }
  return false;
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
