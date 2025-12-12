import {
  consensusClientGnosis,
  consensusClientHolesky,
  consensusClientHoodi,
  consensusClientLukso,
  consensusClientMainnet,
  consensusClientPrater,
  consensusClientSepolia
} from "@dappnode/db";
import { Network } from "@dappnode/types";

// Mapping of each network to its corresponding consensus client getter
const consensusClientMap: { [key in Network]: () => string | null | undefined } = {
  mainnet: () => consensusClientMainnet.get(),
  gnosis: () => consensusClientGnosis.get(),
  hoodi: () => consensusClientHoodi.get(),
  prater: () => consensusClientPrater.get(),
  holesky: () => consensusClientHolesky.get(),
  lukso: () => consensusClientLukso.get(),
  sepolia: () => consensusClientSepolia.get(),
  starknet: () => null,
  "starknet-sepolia": () => null
};

export async function consensusClientsGetByNetworks({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, string | null | undefined>>> {
  const result: Partial<Record<Network, string | null | undefined>> = {};

  for (const network of networks) {
    const getter = consensusClientMap[network];
    result[network] = getter ? getter() : undefined;
  }

  return result;
}
