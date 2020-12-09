import { ChainData } from "../../types";
import { logs } from "../../logs";
import { listPackages } from "../docker/listContainers";
import { parseChainErrors } from "./utils";
import { runWithChainDriver } from "./drivers";
import { getChainDriverName } from "./getChainDriverName";

// Keep track of already logged errors to reduce spam
// This functions are called often so the same error will persist
const loggedErrors = new Map<string, string>();

/**
 * Get chains to call from docker ps
 * Query all blockchains at once and return syncing status or error
 */
export async function getChainsData(): Promise<ChainData[]> {
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
