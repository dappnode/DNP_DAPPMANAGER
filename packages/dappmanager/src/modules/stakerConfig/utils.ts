import { StakerConfigSet, Network } from "../../types";
import * as db from "../../db";

/**
 * Sets the staker configuration on db for a given network
 */
export function setStakerConfigOnDb(
  network: Network,
  stakerConfig: StakerConfigSet
): void {
  switch (network) {
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
      throw new Error(`Unsupported network: ${network}`);
  }
}

/**
 * Get the current staker config (execution and consensus clients selected) as well as
 * the pkgs available for each network
 */
export function getNetworkStakerPkgs(network: Network): {
  execClientsAvail: string[];
  currentExecClient: string;
  consClientsAvail: string[];
  currentConsClient: string;
  web3signerAvail: string;
  mevBoostAvail: string;
  isMevBoostSelected: boolean;
} {
  switch (network) {
    case "mainnet":
      return {
        execClientsAvail: [
          "geth.dnp.dappnode.eth",
          "nethermind.public.dappnode.eth",
          "erigon.dnp.dappnode.eth"
          //"besu.dnp.dappnode.eth",
        ],
        currentExecClient: db.executionClientMainnet.get(),
        consClientsAvail: [
          "prysm.dnp.dappnode.eth",
          "lighthouse.dnp.dappnode.eth",
          "teku.dnp.dappnode.eth",
          "nimbus.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientMainnet.get(),
        web3signerAvail: "web3signer.dnp.dappnode.eth",
        mevBoostAvail: "mevboost.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostMainnet.get()
      };

    case "gnosis":
      return {
        execClientsAvail: ["nethermind-xdai.dnp.dappnode.eth"],
        currentExecClient: db.executionClientGnosis.get(),
        consClientsAvail: [
          "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
          "lighthouse-gnosis.dnp.dappnode.eth",
          "teku-gnosis.dnp.dappnode.eth"
          //"nimbus-gnosis.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientGnosis.get(),
        web3signerAvail: "web3signer-gnosis.dnp.dappnode.eth",
        mevBoostAvail: "mevboost-gnosis.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostGnosis.get()
      };
    case "prater":
      return {
        execClientsAvail: [
          "goerli-geth.dnp.dappnode.eth",
          "goerli-erigon.dnp.dappnode.eth",
          "goerli-nethermind.dnp.dappnode.eth"
        ],
        currentExecClient: db.executionClientPrater.get(),
        consClientsAvail: [
          "prysm-prater.dnp.dappnode.eth",
          "lighthouse-prater.dnp.dappnode.eth",
          "teku-prater.dnp.dappnode.eth",
          "nimbus-prater.dnp.dappnode.eth"
        ],
        currentConsClient: db.consensusClientPrater.get(),
        web3signerAvail: "web3signer-prater.dnp.dappnode.eth",
        mevBoostAvail: "mev-boost-goerli.dnp.dappnode.eth",
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
