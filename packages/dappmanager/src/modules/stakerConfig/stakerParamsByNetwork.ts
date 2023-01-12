import * as db from "../../db";
import { Network, StakerParamsByNetwork } from "@dappnode/common";

/**
 * Get the current staker config (execution and consensus clients selected) as well as
 * the pkgs available for each network
 */
export function stakerParamsByNetwork<T extends Network>(
  network: T
): StakerParamsByNetwork<T> {
  switch (network) {
    case "mainnet":
      return {
        execClients: [
          {
            dnpName: "geth.dnp.dappnode.eth",
            minVersion: "0.1.37"
          },
          {
            dnpName: "nethermind.public.dappnode.eth",
            minVersion: "1.0.27"
          },
          {
            dnpName: "erigon.dnp.dappnode.eth",
            minVersion: "0.1.34"
          },
          {
            dnpName: "besu.public.dappnode.eth",
            minVersion: "1.2.6"
          }
        ],
        currentExecClient: db.executionClientMainnet.get(),
        consClients: [
          {
            dnpName: "prysm.dnp.dappnode.eth",
            minVersion: "3.0.4"
          },
          {
            dnpName: "lighthouse.dnp.dappnode.eth",
            minVersion: "1.0.3"
          },
          {
            dnpName: "teku.dnp.dappnode.eth",
            minVersion: "2.0.4"
          },
          {
            dnpName: "nimbus.dnp.dappnode.eth",
            minVersion: "1.0.5"
          }
        ],
        currentConsClient: db.consensusClientMainnet.get(),
        web3signer: {
          dnpName: "web3signer.dnp.dappnode.eth",
          minVersion: "0.1.4"
        },
        mevBoost: "mev-boost.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostMainnet.get()
      } as StakerParamsByNetwork<T>;

    case "gnosis":
      return {
        execClients: [
          {
            dnpName: "nethermind-xdai.dnp.dappnode.eth",
            minVersion: "1.0.18"
          }
        ],
        currentExecClient: db.executionClientGnosis.get(),
        consClients: [
          {
            dnpName: "gnosis-beacon-chain-prysm.dnp.dappnode.eth",
            minVersion: "2.0.0"
          },
          {
            dnpName: "lighthouse-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.5"
          },
          {
            dnpName: "teku-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.5"
          }
        ],
        currentConsClient: db.consensusClientGnosis.get(),
        web3signer: {
          dnpName: "web3signer-gnosis.dnp.dappnode.eth",
          minVersion: "0.1.10"
        },
        mevBoost: "mev-boost-gnosis.dnp.dappnode.eth",
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
        currentExecClient: db.executionClientPrater.get(),
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
        currentConsClient: db.consensusClientPrater.get(),
        web3signer: {
          dnpName: "web3signer-prater.dnp.dappnode.eth",
          minVersion: "0.1.11"
        },
        mevBoost: "mev-boost-goerli.dnp.dappnode.eth",
        isMevBoostSelected: db.mevBoostPrater.get()
      } as StakerParamsByNetwork<T>;
    default:
      throw Error(`Unsupported network: ${network}`);
  }
}
