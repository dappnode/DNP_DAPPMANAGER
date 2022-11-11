import * as db from "../../db";
import { Network, StakerParamsByNetwork } from "../../types";

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
            minVersion: ""
          },
          {
            dnpName: "nethermind.public.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "erigon.dnp.dappnode.eth",
            minVersion: ""
          },
          {
            dnpName: "besu.public.dappnode.eth",
            minVersion: ""
          }
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
        mevBoost: "mev-boost.dnp.dappnode.eth",
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
          },
          {
            dnpName: "lodestar-prater.dnp.dappnode.eth",
            minVersion: "0.1.0"
          }
        ],
        currentConsClient: db.consensusClientPrater.get() || "",
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
