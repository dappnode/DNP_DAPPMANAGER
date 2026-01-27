import {
  executionClientGnosis,
  executionClientHolesky,
  executionClientHoodi,
  executionClientLukso,
  executionClientMainnet,
  executionClientPrater,
  executionClientSepolia
} from "@dappnode/db";
import { Network } from "@dappnode/types";

// Mapping of each network to its corresponding execution client getter
const executionClientMap: { [key in Network]: () => string | null | undefined } = {
  mainnet: () => executionClientMainnet.get(),
  gnosis: () => executionClientGnosis.get(),
  hoodi: () => executionClientHoodi.get(),
  prater: () => executionClientPrater.get(),
  holesky: () => executionClientHolesky.get(),
  lukso: () => executionClientLukso.get(),
  sepolia: () => executionClientSepolia.get(),
  starknet: () => null,
  "starknet-sepolia": () => null
};

export async function executionClientsGetByNetworks({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, string | null | undefined>>> {
  const result: Partial<Record<Network, string | null | undefined>> = {};

  for (const network of networks) {
    const getter = executionClientMap[network];
    result[network] = getter ? getter() : undefined;
  }

  return result;
}
