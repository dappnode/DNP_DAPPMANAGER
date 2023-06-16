import {
  UserSettingsAllDnps,
  InstalledPackageData,
  InstalledPackageDataApiReturn,
  StakerItemData,
  PackageRelease
} from "@dappnode/common";
import { logs } from "../../logs.js";
import { dockerContainerStop } from "../docker/index.js";
import { pick } from "lodash-es";
import { Manifest, Network } from "@dappnode/types";

/**
 * Get the validator service name.
 * - Nimbus package is monoservice (beacon-validator)
 * - Prysm, Teku, Lighthouse, and Lodestar are multiservice (beacon, validator)
 */
function getValidatorServiceName(dnpName: string): string {
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

const getDefaultCheckpointSync = (network: Network): string =>
  network === "mainnet"
    ? "https://checkpoint-sync.dappnode.io"
    : network === "prater"
    ? "https://checkpoint-sync-prater.dappnode.io"
    : network === "gnosis"
    ? "https://checkpoint-sync-gnosis.dappnode.io"
    : "";

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
