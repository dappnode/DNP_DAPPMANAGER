import {
  consensusClientGnosis,
  consensusClientHolesky,
  consensusClientHoodi,
  consensusClientLukso,
  consensusClientMainnet,
  consensusClientPrater,
  consensusClientSepolia
} from "@dappnode/db";
import { Network, L1Network, isL1Network } from "@dappnode/types";

// Mapping of each L1 network to its corresponding consensus client getter
const consensusClientMap: { [key in L1Network]: () => string | null | undefined } = {
  mainnet: () => consensusClientMainnet.get(),
  gnosis: () => consensusClientGnosis.get(),
  hoodi: () => consensusClientHoodi.get(),
  prater: () => consensusClientPrater.get(),
  holesky: () => consensusClientHolesky.get(),
  lukso: () => consensusClientLukso.get(),
  sepolia: () => consensusClientSepolia.get()
};

export async function consensusClientsGetByNetworks({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, string | null | undefined>>> {
  const result: Partial<Record<Network, string | null | undefined>> = {};

  for (const network of networks) {
    if (isL1Network(network)) {
      const getter = consensusClientMap[network];
      result[network] = getter ? getter() : undefined;
    }
    // L2 networks don't have separate consensus clients, skip them
  }

  return result;
}
