import { getEthersProvider } from "../../ethProvider";
import { ethers } from "ethers";
import * as db from "../../../db";
import { ApmVersion } from "../../../types";
import * as repoContract from "../../../contracts/repository";
import { parseApmVersionReturn, toApmVersionArray } from "./apmUtils";

/**
 * Fetch a specific version of an APM repo
 * @param name "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.4"
 */
export default async function fetchVersion(
  name: string,
  version: string
): Promise<ApmVersion> {
  // Load cache if available
  const cachedResult = db.apmCache.get({ name, version });
  if (cachedResult) return cachedResult;

  const provider = getEthersProvider();
  const repo = new ethers.Contract(name, repoContract.abi, provider);

  const apmVersion = await repo
    .getBySemanticVersion(toApmVersionArray(version))
    .then(parseApmVersionReturn);

  // Validate and store cache
  if (apmVersion.version === version)
    db.apmCache.set({ name, version }, apmVersion);

  return apmVersion;
}
