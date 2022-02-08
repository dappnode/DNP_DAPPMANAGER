import { InstalledPackageData } from "../../../common";
import { ChainDriver } from "../../../types";
import { ChainDataResult } from "../types";
// Drivers
import { bitcoin } from "./bitcoin";
import { ethereum } from "./ethereum";
import { ethereum2 } from "./ethereum2";
import { monero } from "./monero";

/**
 * Returns chain data given a driver and api URL
 *
 * Make sure that there's only one call at once per name and api
 * If the previous call to runDriver is active, the result of the previous call
 * will be returned to all pending calls
 */
export async function runWithChainDriver(
  dnp: InstalledPackageData,
  chainDriverName: ChainDriver
): Promise<ChainDataResult | null> {
  switch (chainDriverName) {
    case "bitcoin":
      return await bitcoin(dnp);

    case "ethereum":
      return await ethereum(dnp);

    case "ethereum2" || "ethereum2-beacon-chain-prysm":
      return await ethereum2(dnp);

    case "monero":
      return await monero(dnp);

    default:
      throw Error(`Unsupported driver: ${chainDriverName}`);
  }
}
