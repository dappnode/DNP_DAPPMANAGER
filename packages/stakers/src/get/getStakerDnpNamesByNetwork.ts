import {
  Network,
  consensusClientsGnosis,
  consensusClientsMainnet,
  consensusClientsPrater,
  consensusClientsLukso,
  executionClientsGnosis,
  executionClientsMainnet,
  executionClientsPrater,
  executionClientsLukso,
  mevBoostMainnet,
  mevBoostPrater,
  signerGnosis,
  signerMainnet,
  signerPrater,
  signerLukso,
  signerHolesky,
  consensusClientsHolesky,
  executionClientsHolesky,
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
        executionClients: executionClientsMainnet,
        consensusClients: consensusClientsMainnet,
        signer: signerMainnet,
        mevBoost: mevBoostMainnet,
      };
    case "prater":
      return {
        executionClients: executionClientsPrater,
        consensusClients: consensusClientsPrater,
        signer: signerPrater,
        mevBoost: mevBoostPrater,
      };
    case "holesky":
      return {
        executionClients: executionClientsHolesky,
        consensusClients: consensusClientsHolesky,
        signer: signerHolesky,
        mevBoost: "",
      };
    case "gnosis":
      return {
        executionClients: executionClientsGnosis,
        consensusClients: consensusClientsGnosis,
        signer: signerGnosis,
        mevBoost: "", // As no mevBoost for gnosis is specified
      };
    case "lukso":
      return {
        executionClients: executionClientsLukso,
        consensusClients: consensusClientsLukso,
        signer: signerLukso,
        mevBoost: "", // As no mevBoost for lukso is specified
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
