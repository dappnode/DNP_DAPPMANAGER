import {
  ChainDriver,
  ChainDriverSpecs,
  InstalledPackageData
} from "../../../common";
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
  chainDriver: ChainDriver
): Promise<ChainDataResult | null> {
  let chainDriverSpecs: ChainDriverSpecs;
  if (typeof chainDriver === "string") {
    chainDriverSpecs = {
      driver: chainDriver
    };
  } else {
    chainDriverSpecs = chainDriver;
  }

  switch (chainDriverSpecs.driver) {
    case "bitcoin":
      return bitcoin(dnp);
    case "ethereum":
      return ethereum(dnp);
    case "ethereum2-beacon-chain-prysm": // TEMPORARY! Remove when all prysm dnps are updated: https://github.com/dappnode/DAppNodePackage-prysm/pull/62 and https://github.com/dappnode/DAppNodePackage-prysm-prater/pull/35
    case "ethereum-beacon-chain":
      return ethereum2(dnp, chainDriverSpecs);
    case "monero":
      return monero(dnp);
    default:
      throw Error(`Unsupported chain: ${chainDriverSpecs.driver}`);
  }
}
