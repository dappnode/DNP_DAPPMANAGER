import {
  Network,
  consensusClientsGnosis,
  consensusClientsMainnet,
  consensusClientsPrater,
  executionClientsGnosis,
  executionClientsMainnet,
  executionClientsPrater,
  mevBoostMainnet,
  mevBoostPrater,
  signerGnosis,
  signerMainnet,
  signerPrater
} from "@dappnode/types";

interface StakerDnpNamesByNetwork {
  executionClients: readonly string[];
  consensusClients: readonly string[];
  signer: readonly string[];
  mevBoost: readonly string[];
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
        mevBoost: mevBoostMainnet
      };
    case "prater":
      return {
        executionClients: executionClientsPrater,
        consensusClients: consensusClientsPrater,
        signer: signerPrater,
        mevBoost: mevBoostPrater
      };
    case "gnosis":
      return {
        executionClients: executionClientsGnosis,
        consensusClients: consensusClientsGnosis,
        signer: signerGnosis,
        mevBoost: [] // As no mevBoost for gnosis is specified
      };
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
