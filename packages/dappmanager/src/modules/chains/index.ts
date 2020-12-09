import memoize from "memoizee";
import { ChainData } from "../../types";
import { logs } from "../../logs";
import { listPackages } from "../docker/listContainers";
import { parseChainErrors } from "./utils";
import { runWithChainDriver } from "./drivers";
import { getChainDriverName } from "./getChainDriverName";

// Memoize this call since multiple UIs could be requesting it at once
// and the info doesn't change often and might be expensive to fetch
export const getChainData = memoize(getChainDataFn, {
  // Wait for Promises to resolve. Do not cache rejections
  promise: true,
  // Cache result for 5 seconds
  maxAge: 5 * 1000
});

// Keep track of already logged errors to reduce spam
// This functions are called often so the same error will persist
const loggedErrors = new Map<string, string>();

/**
 * Get chains to call from docker ps
 * Query all blockchains at once and return syncing status or error
 */
async function getChainDataFn(): Promise<ChainData[]> {
  const dnpList = await listPackages();

  const chainsData: ChainData[] = [];

  await Promise.all(
    dnpList.map(async dnp => {
      try {
        const chainDriverName = getChainDriverName(dnp);
        if (!chainDriverName) return;

        const chainData = await runWithChainDriver(dnp, chainDriverName);
        loggedErrors.delete(dnp.dnpName); // Reset last seen error

        chainsData.push({
          dnpName: dnp.dnpName,
          ...chainData
        });
      } catch (e) {
        // Only log chain errors the first time they are seen
        if (loggedErrors.get(dnp.dnpName) !== e.message)
          logs.debug(`Error on chain ${dnp.dnpName} watcher`, e);
        loggedErrors.set(dnp.dnpName, e.message);

        chainsData.push({
          dnpName: dnp.dnpName,
          syncing: false,
          error: true,
          message: parseChainErrors(e)
        });
      }
    })
  );

  return chainsData;
}
