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
  let value = n / 1e9;
  let symbol = "ETH";
  switch (network) {
    case Network.Lukso:
      symbol = "LYX";
      break;
    case Network.Gnosis:
      // Gnosis validators stake 1 GNO which equals 32 ETH in the beacon chain
      // So we need to divide by 32 to convert the ETH-denominated balance to GNO
      value = value / 32;
      symbol = "GNO";
      break;
    // Add more networks and their symbols as needed
    default:
      symbol = "ETH";
  }
  return `${value.toFixed(decimals)} ${symbol}`;
}
