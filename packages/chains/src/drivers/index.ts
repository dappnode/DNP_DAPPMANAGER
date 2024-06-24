import {
  ChainDriver,
  ChainDriverSpecs,
  InstalledPackageData,
} from "@dappnode/types";
import { ChainDataResult } from "../types.js";
// Drivers
import { bitcoin } from "./bitcoin.js";
import { ethereum } from "./ethereum.js";
import { ethereum2 } from "./ethereum2.js";
import { monero } from "./monero.js";
import { avalanche } from "./avalanche.js";
import { substrate } from "./substrate.js";
import { tendermint } from "./tendermint.js";

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
      driver: chainDriver,
    };
  } else {
    chainDriverSpecs = chainDriver;
  }

  switch (chainDriverSpecs.driver) {
    case "bitcoin":
      return bitcoin(dnp);
    case "ethereum":
      return ethereum(dnp, chainDriverSpecs);
    case "ethereum2-beacon-chain-prysm": // TEMPORARY! Remove when all prysm dnps are updated: https://github.com/dappnode/DAppNodePackage-prysm/pull/62 and https://github.com/dappnode/DAppNodePackage-prysm-prater/pull/35
    case "ethereum-beacon-chain":
      return ethereum2(dnp, chainDriverSpecs);
    case "monero":
      return monero(dnp);
    case "avalanche":
      return avalanche(dnp, chainDriverSpecs);
    case "tendermint":
      return tendermint(dnp, chainDriverSpecs);
    case "substrate":
      return substrate(dnp, chainDriverSpecs);
    default:
      throw Error(`Unsupported chain: ${chainDriverSpecs.driver}`);
  }
}
