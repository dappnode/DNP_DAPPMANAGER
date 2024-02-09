import {
  ConsensusClient,
  ExecutionClient,
  MevBoost,
  Signer,
  StakerCompatibleVersionsByNetwork,
  Network,
} from "@dappnode/types";

/**
 * Get the current staker config (execution and consensus clients selected) as well as
 * the pkgs available for each network
 */
export function getStakerCompatibleVersionsByNetwork<T extends Network>(
  network: T
): StakerCompatibleVersionsByNetwork<T> {
  switch (network) {
    case "mainnet":
      return {
        compatibleExecution: [
          {
            dnpName: "geth.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.37",
          },
          {
            dnpName: "nethermind.public.dappnode.eth" as ExecutionClient<T>,
            minVersion: "1.0.27",
          },
          {
            dnpName: "erigon.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.34",
          },
          {
            dnpName: "besu.public.dappnode.eth" as ExecutionClient<T>,
            minVersion: "1.2.6",
          },
        ],
        compatibleConsensus: [
          {
            dnpName: "prysm.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "3.0.4",
          },
          {
            dnpName: "lighthouse.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "1.0.3",
          },
          {
            dnpName: "teku.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "2.0.4",
          },
          {
            dnpName: "nimbus.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "1.0.5",
          },
          {
            dnpName: "lodestar.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleSigner: {
          dnpName: "web3signer.dnp.dappnode.eth" as Signer<T>,
          minVersion: "0.1.4",
        },
        compatibleMevBoost: {
          dnpName: "mev-boost.dnp.dappnode.eth" as MevBoost<T>,
          minVersion: "0.1.0",
        },
      };

    case "gnosis":
      return {
        compatibleExecution: [
          {
            dnpName: "nethermind-xdai.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "1.0.18",
          },
          {
            dnpName: "gnosis-erigon.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleConsensus: [
          {
            dnpName: "lighthouse-gnosis.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.5",
          },
          {
            dnpName: "teku-gnosis.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.5",
          },
          {
            dnpName: "lodestar-gnosis.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleSigner: {
          dnpName: "web3signer-gnosis.dnp.dappnode.eth" as Signer<T>,
          minVersion: "0.1.10",
        },
        compatibleMevBoost: null as MevBoost<"gnosis">, // No MEV-Boost for Gnosis
      };
    case "prater":
      return {
        compatibleExecution: [
          {
            dnpName: "goerli-geth.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.4.26",
          },
          {
            dnpName: "goerli-erigon.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "goerli-nethermind.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "1.0.1",
          },
          {
            dnpName: "goerli-besu.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleConsensus: [
          {
            dnpName: "prysm-prater.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "1.0.15",
          },
          {
            dnpName: "lighthouse-prater.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.9",
          },
          {
            dnpName: "teku-prater.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.10",
          },
          {
            dnpName: "nimbus-prater.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.7",
          },
          {
            dnpName: "lodestar-prater.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleSigner: {
          dnpName: "web3signer-prater.dnp.dappnode.eth" as Signer<T>,
          minVersion: "0.1.11",
        },
        compatibleMevBoost: {
          dnpName: "mev-boost-goerli.dnp.dappnode.eth" as MevBoost<T>,
          minVersion: "0.1.0",
        },
      };
    case "holesky":
      return {
        compatibleExecution: [
          {
            dnpName: "holesky-geth.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "holesky-erigon.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName:
              "holesky-nethermind.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "holesky-besu.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleConsensus: [
          {
            dnpName:
              "lighthouse-holesky.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "prysm-holesky.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "teku-holesky.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "nimbus-holesky.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "lodestar-holesky.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleSigner: {
          dnpName: "web3signer-holesky.dnp.dappnode.eth" as Signer<T>,
          minVersion: "0.1.0",
        },
        compatibleMevBoost: {
          dnpName: "mev-boost-holesky.dnp.dappnode.eth" as MevBoost<T>,
          minVersion: "0.1.0",
        },
      };
    case "lukso":
      return {
        compatibleExecution: [
          {
            dnpName: "lukso-geth.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0",
          },
          /*{
            dnpName: "lukso-erigon.dnp.dappnode.eth" as ExecutionClient<T>,
            minVersion: "0.1.0"
          }*/
        ],
        compatibleConsensus: [
          /*{
            dnpName: "lighthouse-lukso.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0"
          },*/
          {
            dnpName: "prysm-lukso.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
          {
            dnpName: "teku-lukso.dnp.dappnode.eth" as ConsensusClient<T>,
            minVersion: "0.1.0",
          },
        ],
        compatibleSigner: {
          dnpName: "web3signer-lukso.dnp.dappnode.eth" as Signer<T>,
          minVersion: "0.1.0",
        },
        compatibleMevBoost: null as MevBoost<"lukso">, // No MEV-Boost for Lukso
      };
    default:
      throw Error(`Unsupported network: ${network}`);
  }
}
