import {
  ConsensusClientGnosis,
  ConsensusClientHolesky,
  ConsensusClientLukso,
  ConsensusClientMainnet,
  ConsensusClientPrater,
  ExecutionClientGnosis,
  ExecutionClientHolesky,
  ExecutionClientLukso,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  SignerMainnet,
  SignerGnosis,
  SignerPrater,
  SignerHolesky,
  SignerLukso,
  MevBoostMainnet,
  MevBoostPrater,
  MevBoostHolesky,
  Network,
} from "@dappnode/types";

interface StakerDnpNamesByNetwork {
  executionClients: readonly string[];
  consensusClients: readonly string[];
  signer: string;
  mevBoost: string;
}

export function getStakerDnpNamesByNetwork(
  network: Network
): StakerDnpNamesByNetwork {
  switch (network) {
    case "mainnet":
      return {
        executionClients: Object.values(ExecutionClientMainnet),
        consensusClients: Object.values(ConsensusClientMainnet),
        signer: Object.values(SignerMainnet)[0],
        mevBoost: Object.values(MevBoostMainnet)[0],
      };
    case "prater":
      return {
        executionClients: Object.values(ExecutionClientPrater),
        consensusClients: Object.values(ConsensusClientPrater),
        signer: Object.values(SignerPrater)[0],
        mevBoost: Object.values(MevBoostPrater)[0],
      };
    case "holesky":
      return {
        executionClients: Object.values(ExecutionClientHolesky),
        consensusClients: Object.values(ConsensusClientHolesky),
        signer: Object.values(SignerHolesky)[0],
        mevBoost: Object.values(MevBoostHolesky)[0],
      };
    case "gnosis":
      return {
        executionClients: Object.values(ExecutionClientGnosis),
        consensusClients: Object.values(ConsensusClientGnosis),
        signer: Object.values(SignerGnosis)[0],
        mevBoost: "", // As no mevBoost for gnosis is specified
      };
    case "lukso":
      return {
        executionClients: Object.values(ExecutionClientLukso),
        consensusClients: Object.values(ConsensusClientLukso),
        signer: Object.values(SignerLukso)[0],
        mevBoost: "", // As no mevBoost for lukso is specified
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
