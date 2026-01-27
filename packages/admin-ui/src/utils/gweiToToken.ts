import { Network } from "@dappnode/types";

/**
 * Converts a gwei value (string or number) to the main token unit for the given network.
 * @param gwei - The value in gwei (string or number)
 * @param network - The network (Network.Mainnet, Network.Lukso, Network.Gnosis)
 * @param decimals - Number of decimals to display (default: 4)
 * @returns The value in the correct token unit as a string
 */
export function gweiToToken(gwei: string | number, network: Network, decimals = 4): string {
  const n = typeof gwei === "string" ? parseFloat(gwei) : gwei;
  if (isNaN(n)) return "-";
  const value = n / 1e9;
  let symbol = "ETH";
  switch (network) {
    case Network.Lukso:
      symbol = "LYX";
      break;
    case Network.Gnosis:
      symbol = "GNO";
      break;
    // Add more networks and their symbols as needed
    default:
      symbol = "ETH";
  }
  return `${value.toFixed(decimals)} ${symbol}`;
}
