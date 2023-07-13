import {
  UserSettingsAllDnps,
  StakerItemData,
  PackageRelease,
  ConsensusClient,
  ExecutionClient,
  StakerConfigByNetwork
} from "@dappnode/common";
import { pick } from "lodash-es";
import { Manifest, Network } from "@dappnode/types";
import * as db from "../../db/index.js";

export function getStakerConfigByNetwork<T extends Network>(
  network: T
): StakerConfigByNetwork<T> {
  switch (network) {
    case "mainnet":
      return {
        executionClient: db.executionClientMainnet.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientMainnet.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientMainnet.get(),
        isMevBoostSelected: db.mevBoostMainnet.get()
      };
    case "gnosis":
      return {
        executionClient: db.executionClientGnosis.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientGnosis.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientGnosis.get(),
        isMevBoostSelected: false // gnosis doesn't support mevBoost
      };
    case "prater":
      return {
        executionClient: db.executionClientPrater.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientPrater.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientPrater.get(),
        isMevBoostSelected: db.mevBoostPrater.get()
      };
    case "lukso":
      return {
        executionClient: db.executionClientLukso.get() as ExecutionClient<T>,
        consensusClient: db.consensusClientLukso.get() as ConsensusClient<T>,
        feeRecipient: db.feeRecipientLukso.get(),
        isMevBoostSelected: false // lukso doesn't support mevBoost
      };
    default:
      throw new Error(`Network ${network} not supported`);
  }
}

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
    : network === "lukso"
    ? "https://checkpoint-sync-lukso.dappnode.io"
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
