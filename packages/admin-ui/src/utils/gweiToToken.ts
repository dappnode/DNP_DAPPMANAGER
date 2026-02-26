import { Network } from "@dappnode/types";
import { formatUnits } from "ethers";

/**
 * Converts a gwei value (string or number) to the main token unit for the given network.
 * @param gwei - The value in gwei (string or number)
 * @param network - The network (Network.Mainnet, Network.Lukso, Network.Gnosis)
 * @param decimals - Number of decimals to display (default: 4)
 * @returns The value in the correct token unit as a string
 */
export function gweiToToken(gwei: number, network: Network, decimals = 4): string {
  if (isNaN(gwei)) return "-";
  // Convert from gwei to ETH
  let valueInEth = parseFloat(formatUnits(gwei, "gwei"));
  let symbol = "ETH";
  switch (network) {
    case Network.Lukso:
      symbol = "LYX";
      break;
    case Network.Gnosis:
      // Gnosis validators stake 1 GNO which equals 32 ETH in the beacon chain
      // So we need to divide by 32 to convert the ETH-denominated balance to GNO
      valueInEth = valueInEth / 32;
      symbol = "GNO";
      break;
    // Add more networks and their symbols as needed
    default:
      symbol = "ETH";
  }

  // Format with specified decimals
  return `${valueInEth.toFixed(decimals)} ${symbol}`;
}
