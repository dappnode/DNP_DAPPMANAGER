import { ChainDriver } from "../../../types";
import memoize from "memoizee";
import { getDotDappnodeDomain } from "../../nsupdate/utils";
// Drivers
import { bitcoin } from "./bitcoin";
import { ethereum } from "./ethereum";
import { ethereum2Prysm } from "./ethereum2Prysm";
import { monero } from "./monero";
import { Chain } from "../types";
import { ChainDataResult } from "../types";

/**
 * Returns an API link given a driverName and dnpName
 * @param driverName
 * @param dnpName
 */
export function getDriverApi(driverName: ChainDriver, dnpName: string): string {
  const packageDomain = getDotDappnodeDomain(dnpName);

  switch (driverName) {
    case "bitcoin":
      //     'bitcoin.dappnode'
      return packageDomain;

    case "ethereum":
      //     'http://ropsten.dappnode:8545'
      return `http://${packageDomain}:8545`;

    case "ethereum2-beacon-chain-prysm":
      //      http://beacon-chain.prysm-pyrmont.dappnode:3500/
      return `http://beacon-chain.${packageDomain}:3500`;

    case "monero":
      //     'http://monero.dappnode:18081'
      return `http://${packageDomain}:18081`;
  }
}

/**
 * Returns chain data given a driver and api URL
 *
 * Make sure that there's only one call at once per name and api
 * If the previous call to runDriver is active, the result of the previous call
 * will be returned to all pending calls
 */
export default memoize(runDriver, {
  // Wait for Promises to resolve. Do not cache rejections
  promise: true,
  // Return the computed cached result to only waiting calls while the
  // result if being computed. Right as it is resolved, compute it again
  maxAge: 100,
  // Stringify chain object
  normalizer: (args: [Chain]) => {
    const chain = args[0];
    return chain.driverName + chain.api;
  }
});

async function runDriver(chain: Chain): Promise<ChainDataResult> {
  switch (chain.driverName) {
    case "bitcoin":
      return await bitcoin(chain.api);
    case "ethereum":
      return await ethereum(chain.api);
    case "ethereum2-beacon-chain-prysm":
      return await ethereum2Prysm(chain.api);
    case "monero":
      return await monero(chain.api);
    default:
      throw Error(`Unsupported driver: ${chain.driverName}`);
  }
}
