import { UserSettingsAllDnps, Network } from "@dappnode/types";

// TODO: remove these utils

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
}: {
  dnpName: string;
  network: Network;
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
                ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient, // TODO: consider setting the MEV fee recipient as the default
                // Graffiti is a mandatory value
                ["GRAFFITI"]: defaultDappnodeGraffiti,
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: getDefaultCheckpointSync(network),
              },
            }
          : {
              [validatorServiceName]: {
                // Fee recipient is set as global env, keep this for backwards compatibility
                ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient,
                // Graffiti is a mandatory value
                ["GRAFFITI"]: defaultDappnodeGraffiti,
              },

              [beaconServiceName]: {
                // Fee recipient is set as global env, keep this for backwards compatibility
                ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient,
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]: getDefaultCheckpointSync(network),
              },
            },
    },
  };
}

const getDefaultCheckpointSync = (network: Network): string =>
  network === "mainnet"
    ? "https://checkpoint-sync.dappnode.io"
    : network === "prater"
    ? "https://checkpoint-sync-prater.dappnode.io"
    : network === "gnosis"
    ? "https://checkpoint-sync-gnosis.dappnode.io"
    : network === "holesky"
    ? "https://checkpoint-sync-holesky.dappnode.io"
    : network === "lukso"
    ? "https://checkpoints.mainnet.lukso.network"
    : "";
