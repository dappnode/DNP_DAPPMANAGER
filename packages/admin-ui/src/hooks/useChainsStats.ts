import { Network } from "@dappnode/types";

export function useChainStats() {
  const isLoading = false;
  const chainStats: Partial<Record<Network, string>> = {
    [Network.Mainnet]: "99.9%",
    [Network.Hoodi]: "98.7%"
  };

  return { isLoading, chainStats };
}
