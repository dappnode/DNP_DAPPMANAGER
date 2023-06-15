import { Network } from "@dappnode/types";
import { StakerCompatibleVersionsByNetwork } from "@dappnode/common";

/**
 * Get the current staker config (execution and consensus clients selected) as well as
 * the pkgs available for each network
 */
export function getStakerCompatibleVersionsByNetwork(
  network: Network
): StakerCompatibleVersionsByNetwork<Network> {
  switch (network) {
    case "mainnet":
      return {
        compatibleExecution: [
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
        compatibleConsensus: [
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
          },
          {
            dnpName: "lodestar.dnp.dappnode.eth",
            minVersion: "0.1.0"
          }
        ],
        compatibleSigner: {
          dnpName: "web3signer.dnp.dappnode.eth",
          minVersion: "0.1.4"
        },
        compatibleMevBoost: {
          dnpName: "mev-boost.dnp.dappnode.eth",
          minVersion: "0.1.0"
        }
      };

    case "gnosis":
      return {
        compatibleExecution: [
          {
            dnpName: "nethermind-xdai.dnp.dappnode.eth",
            minVersion: "1.0.18"
          }
        ],
        compatibleConsensus: [
          {
            dnpName: "lighthouse-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.5"
          },
          {
            dnpName: "teku-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.5"
          },
          {
            dnpName: "lodestar-gnosis.dnp.dappnode.eth",
            minVersion: "0.1.0"
          }
        ],
        compatibleSigner: {
          dnpName: "web3signer-gnosis.dnp.dappnode.eth",
          minVersion: "0.1.10"
        },
        compatibleMevBoost: null // No MEV-Boost for Gnosis
      };
    case "prater":
      return {
        compatibleExecution: [
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
        compatibleConsensus: [
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
        compatibleSigner: {
          dnpName: "web3signer-prater.dnp.dappnode.eth",
          minVersion: "0.1.11"
        },
        compatibleMevBoost: {
          dnpName: "mev-boost-goerli.dnp.dappnode.eth",
          minVersion: "0.1.0"
        }
      };
    default:
      throw Error(`Unsupported network: ${network}`);
  }
}
