import {
  StakerConfigSet,
  Network,
  ExecutionClientMainnet,
  ConsensusClientMainnet,
  ExecutionClientGnosis,
  ConsensusClientGnosis,
  ExecutionClientPrater,
  ConsensusClientPrater
} from "../../types";
import * as db from "../../db";
import { StakerParamsByNetwork } from "./types";

/**
 * Sets the staker configuration on db for a given network
 */
export function setStakerConfigOnDb<T extends Network>(
  stakerConfig: StakerConfigSet<T>
): void {
  switch (stakerConfig.network) {
    case "mainnet":
      db.executionClientMainnet.set(
        stakerConfig.executionClient as ExecutionClientMainnet
      );
      db.consensusClientMainnet.set(
        stakerConfig.consensusClient as ConsensusClientMainnet
      );
      db.mevBoostMainnet.set(stakerConfig.enableMevBoost || false);
      break;
    case "gnosis":
      db.executionClientGnosis.set(
        stakerConfig.executionClient as ExecutionClientGnosis
      );
      db.consensusClientGnosis.set(
        stakerConfig.consensusClient as ConsensusClientGnosis
      );
      db.mevBoostGnosis.set(stakerConfig.enableMevBoost || false);
      break;
    case "prater":
      db.executionClientPrater.set(
        stakerConfig.executionClient as ExecutionClientPrater
      );
      db.consensusClientPrater.set(
        stakerConfig.consensusClient as ConsensusClientPrater
      );
      db.mevBoostPrater.set(stakerConfig.enableMevBoost || false);
      break;
    default:
      throw new Error(`Unsupported network: ${stakerConfig.network}`);
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
 * Nimbus package is monoservice (beacon-validator)
 */
export function getValidatorServiceName(dnpName: string): string {
  return dnpName.includes("nimbus") ? "beacon-validator" : "validator";
}

/**
 * Get the beacon service name
 * Nimbus package is monoservice (beacon-validator)
 */
export function getBeaconServiceName(dnpName: string): string {
  return dnpName.includes("nimbus") ? "beacon-validator" : "beacon-chain";
}
