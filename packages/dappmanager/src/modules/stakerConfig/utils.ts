import { StakerConfigSet, Network } from "../../types";
import * as db from "../../db";

/**
 * Sets the staker configuration on db for a given network
 */
export function setStakerConfigOnDb(stakerConfig: StakerConfigSet): void {
  switch (stakerConfig.network) {
    case "mainnet":
      db.executionClientMainnet.set(stakerConfig.executionClient);
      db.consensusClientMainnet.set(stakerConfig.consensusClient?.dnpName);
      db.mevBoostMainnet.set(stakerConfig.enableMevBoost);
      break;
    case "gnosis":
      db.executionClientGnosis.set(stakerConfig.executionClient);
      db.consensusClientGnosis.set(stakerConfig.consensusClient?.dnpName);
      db.mevBoostGnosis.set(stakerConfig.enableMevBoost);
      break;
    case "prater":
      db.executionClientPrater.set(stakerConfig.executionClient);
      db.consensusClientPrater.set(stakerConfig.consensusClient?.dnpName);
      db.mevBoostPrater.set(stakerConfig.enableMevBoost);
      break;
    default:
      throw new Error(`Unsupported network: ${stakerConfig.network}`);
  }
}

/**
 * Get the current staker config (execution and consensus clients selected) as well as
 * the pkgs available for each network
 */
export function getNetworkStakerPkgs(network: Network): {
  execClients: { dnpName: string; minVersion: string }[];
  currentExecClient: string;
  consClients: { dnpName: string; minVersion: string }[];
  currentConsClient: string;
  web3signer: { dnpName: string; minVersion: string };
  mevBoostDnpName: string;
  isMevBoostSelected: boolean;
} {
  switch (network) {
    case "mainnet":
      return {
        execClients: [
          { dnpName: "geth.dnp.dappnode.eth", minVersion: "" },
          { dnpName: "nethermind.public.dappnode.eth", minVersion: "" },
          { dnpName: "erigon.dnp.dappnode.eth", minVersion: "" }
          //"besu.dnp.dappnode.eth",
        ],
        currentExecClient: db.executionClientMainnet.get(),
        consClients: [
          { dnpName: "prysm.dnp.dappnode.eth", minVersion: "" },
          { dnpName: "lighthouse.dnp.dappnode.eth", minVersion: "" },
          { dnpName: "teku.dnp.dappnode.eth", minVersion: "" },
          { dnpName: "nimbus.dnp.dappnode.eth", minVersion: "" }
        ],
        currentConsClient: db.consensusClientMainnet.get(),
        web3signer: {
          dnpName: "web3signer.dnp.dappnode.eth",
          minVersion: ""
        },
        mevBoostDnpName: "mevboost.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostMainnet.get()
      };

    case "gnosis":
      return {
        execClients: [
          { dnpName: "nethermind-xdai.dnp.dappnode.eth", minVersion: "" }
        ],
        currentExecClient: db.executionClientGnosis.get(),
        consClients: [
          {
            dnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
            minVersion: ""
          },
          { dnpName: "lighthouse-gnosis.dnp.dappnode.eth", minVersion: "" },
          { dnpName: "teku-gnosis.dnp.dappnode.eth", minVersion: "" }
          //"nimbus-gnosis.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientGnosis.get(),
        web3signer: {
          dnpName: "web3signer-gnosis.dnp.dappnode.eth",
          minVersion: ""
        },
        mevBoostDnpName: "mevboost-gnosis.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostGnosis.get()
      };
    case "prater":
      return {
        execClients: [
          { dnpName: "goerli-geth.dnp.dappnode.eth", minVersion: "0.4.26" },
          { dnpName: "goerli-erigon.dnp.dappnode.eth", minVersion: "0.1.0" },
          {
            dnpName: "goerli-nethermind.dnp.dappnode.eth",
            minVersion: "1.0.1"
          }
        ],
        currentExecClient: db.executionClientPrater.get(),
        consClients: [
          { dnpName: "prysm-prater.dnp.dappnode.eth", minVersion: "1.0.15" },
          {
            dnpName: "lighthouse-prater.dnp.dappnode.eth",
            minVersion: "0.1.9"
          },
          { dnpName: "teku-prater.dnp.dappnode.eth", minVersion: "0.1.10" },
          { dnpName: "nimbus-prater.dnp.dappnode.eth", minVersion: "0.1.7" }
        ],
        currentConsClient: db.consensusClientPrater.get(),
        web3signer: {
          dnpName: "web3signer-prater.dnp.dappnode.eth",
          minVersion: "0.1.11"
        },
        mevBoostDnpName: "mev-boost-goerli.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostPrater.get()
      };
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
