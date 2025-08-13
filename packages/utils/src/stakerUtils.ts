import { UserSettings, Network } from "@dappnode/types";

// TODO: The code in this file should be included in the stakers module

/**
 * Get the user settings for the consensus client.
 * It may be different depending if it is multiservice or monoservice and all the envs are
 * set in the same service
 */
export function getDefaultConsensusUserSettings({ network }: { network: Network }): UserSettings {
  const validatorServiceName = "validator";
  const beaconServiceName = "beacon-chain";
  const beaconValidatorServiceName = "beacon-validator";
  const defaultDappnodeGraffiti = "validating_from_DAppNode";
  const defaultFeeRecipient = "0x0000000000000000000000000000000000000000";
  return {
    environment: {
      // TODO: Remove once Nimbus is split into 2 services
      [beaconValidatorServiceName]: {
        // Fee recipient is set as global env, keep this for backwards compatibility
        ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient, // TODO: consider setting the MEV fee recipient as the default
        // Graffiti is a mandatory value
        ["GRAFFITI"]: defaultDappnodeGraffiti,
        // Checkpoint sync is an optional value
        ["CHECKPOINT_SYNC_URL"]: getDefaultCheckpointSync(network)
      },

      [validatorServiceName]: {
        // Fee recipient is set as global env, keep this for backwards compatibility
        ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient,
        // Graffiti is a mandatory value
        ["GRAFFITI"]: defaultDappnodeGraffiti
      },

      [beaconServiceName]: {
        // Fee recipient is set as global env, keep this for backwards compatibility
        ["FEE_RECIPIENT_ADDRESS"]: defaultFeeRecipient,
        // Checkpoint sync is an optional value
        ["CHECKPOINT_SYNC_URL"]: getDefaultCheckpointSync(network)
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
        : network === "holesky"
          ? "https://checkpoint-sync-holesky.dappnode.io"
          : network === "hoodi"
            ? "https://checkpoint-sync-hoodi.dappnode.io"
            : network === "lukso"
              ? "https://checkpoints.mainnet.lukso.network"
              : network === "sepolia"
                ? "https://checkpoint-sync-sepolia.dappnode.io"
                : "";
