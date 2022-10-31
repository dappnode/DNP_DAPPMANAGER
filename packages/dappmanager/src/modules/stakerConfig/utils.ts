import {
  Network,
  ExecutionClientMainnet,
  ConsensusClientMainnet,
  ExecutionClientGnosis,
  ConsensusClientGnosis,
  ExecutionClientPrater,
  ConsensusClientPrater,
  StakerParamsByNetwork,
  ExececutionClient,
  ConsensusClient,
  UserSettingsAllDnps,
  InstalledPackageData,
  InstalledPackageDataApiReturn,
  StakerItemOk
} from "../../types";
import * as db from "../../db";
import { packageSetEnvironment } from "../../calls";
import { logs } from "../../logs";
import { dockerContainerStop } from "../docker";

/**
 * Sets the staker configuration on db for a given network
 */
export function setStakerConfigOnDb<T extends Network>({
  network,
  executionClient,
  consensusClient,
  enableMevBoost
}: {
  network: T;
  executionClient?: ExececutionClient<T>;
  consensusClient?: ConsensusClient<T>;
  enableMevBoost?: boolean;
}): void {
  switch (network) {
    case "mainnet":
      db.executionClientMainnet.set(executionClient as ExecutionClientMainnet);
      db.consensusClientMainnet.set(consensusClient as ConsensusClientMainnet);
      db.mevBoostMainnet.set(enableMevBoost || false);
      break;
    case "gnosis":
      db.executionClientGnosis.set(executionClient as ExecutionClientGnosis);
      db.consensusClientGnosis.set(consensusClient as ConsensusClientGnosis);
      db.mevBoostGnosis.set(enableMevBoost || false);
      break;
    case "prater":
      db.executionClientPrater.set(executionClient as ExecutionClientPrater);
      db.consensusClientPrater.set(consensusClient as ConsensusClientPrater);
      db.mevBoostPrater.set(enableMevBoost || false);
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Get the current staker config (execution and consensus clients selected) as well as
 * the pkgs available for each network
 */
export function getStakerParamsByNetwork<T extends Network>(
  network: T
): StakerParamsByNetwork<T> {
  switch (network) {
    case "mainnet":
      return {
        execClients: [
          {
            dnpName: "geth.dnp.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "nethermind.public.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "erigon.dnp.dappnode.eth",
            minVersion: ""
          }
          //"besu.dnp.dappnode.eth",
        ],
        currentExecClient: db.executionClientMainnet.get() || "",
        consClients: [
          {
            dnpName: "prysm.dnp.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "lighthouse.dnp.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "teku.dnp.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "nimbus.dnp.dappnode.eth",
            minVersion: ""
          }
        ],
        currentConsClient: db.consensusClientMainnet.get() || "",
        web3signer: {
          dnpName: "web3signer.dnp.dappnode.eth",
          minVersion: ""
        },
        mevBoostDnpName: "mev-boost.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostMainnet.get()
      } as StakerParamsByNetwork<T>;

    case "gnosis":
      return {
        execClients: [
          {
            dnpName: "nethermind-xdai.dnp.dappnode.eth",
            minVersion: ""
          }
        ],
        currentExecClient: db.executionClientGnosis.get() || "",
        consClients: [
          {
            dnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "lighthouse-gnosis.dnp.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "teku-gnosis.dnp.dappnode.eth",
            minVersion: ""
          }
          //"nimbus-gnosis.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientGnosis.get() || "",
        web3signer: {
          dnpName: "web3signer-gnosis.dnp.dappnode.eth",
          minVersion: ""
        },
        mevBoostDnpName: "mev-boost-gnosis.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostGnosis.get()
      } as StakerParamsByNetwork<T>;
    case "prater":
      return {
        execClients: [
          {
            dnpName: "goerli-geth.dnp.dappnode.eth",
            minVersion: "0.4.26"
          },
          {
            dnpName: "goerli-erigon.dnp.dappnode.eth",
            minVersion: "0.1.0"
          },
          {
            dnpName: "goerli-nethermind.dnp.dappnode.eth",
            minVersion: "1.0.1"
          },
          {
            dnpName: "goerli-besu.dnp.dappnode.eth",
            minVersion: "0.1.0"
          }
        ],
        currentExecClient: db.executionClientPrater.get() || "",
        consClients: [
          {
            dnpName: "prysm-prater.dnp.dappnode.eth",
            minVersion: "1.0.15"
          },
          {
            dnpName: "lighthouse-prater.dnp.dappnode.eth",
            minVersion: "0.1.9"
          },
          {
            dnpName: "teku-prater.dnp.dappnode.eth",
            minVersion: "0.1.10"
          },
          {
            dnpName: "nimbus-prater.dnp.dappnode.eth",
            minVersion: "0.1.7"
          }
        ],
        currentConsClient: db.consensusClientPrater.get() || "",
        web3signer: {
          dnpName: "web3signer-prater.dnp.dappnode.eth",
          minVersion: "0.1.11"
        },
        mevBoostDnpName: "mev-boost-goerli.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostPrater.get()
      } as StakerParamsByNetwork<T>;
    default:
      throw Error(`Unsupported network: ${network}`);
  }
}

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
export function getUserSettings<T extends Network>({
  targetConsensusClient
}: {
  targetConsensusClient: StakerItemOk<T, "consensus">;
}): UserSettingsAllDnps {
  const validatorServiceName = getValidatorServiceName(
    targetConsensusClient.dnpName
  );
  const beaconServiceName = getBeaconServiceName(targetConsensusClient.dnpName);
  return {
    [targetConsensusClient.dnpName]: {
      environment:
        beaconServiceName === validatorServiceName
          ? {
              [validatorServiceName]: {
                // Graffiti is a mandatory value
                ["GRAFFITI"]:
                  targetConsensusClient.graffiti || "Validating_from_DAppNode",
                // Fee recipient is a mandatory value
                ["FEE_RECIPIENT_ADDRESS"]:
                  targetConsensusClient.feeRecipient ||
                  "0x0000000000000000000000000000000000000000",
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]:
                  targetConsensusClient.checkpointSync || ""
              }
            }
          : {
              [validatorServiceName]: {
                // Graffiti is a mandatory value
                ["GRAFFITI"]:
                  targetConsensusClient.graffiti || "Validating_from_DAppNode",
                // Fee recipient is a mandatory value
                ["FEE_RECIPIENT_ADDRESS"]:
                  targetConsensusClient.feeRecipient ||
                  "0x0000000000000000000000000000000000000000"
              },

              [beaconServiceName]: {
                // Checkpoint sync is an optional value
                ["CHECKPOINT_SYNC_URL"]:
                  targetConsensusClient.checkpointSync || ""
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
