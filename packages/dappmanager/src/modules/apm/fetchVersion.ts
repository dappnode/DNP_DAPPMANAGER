import { ethers } from "ethers";
import { ApmRepoVersionReturn, ApmVersionRaw } from "./types.js";
import * as repoContract from "../../contracts/repository.js";
import { parseApmVersionReturn, toApmVersionArray } from "./apmUtils.js";
import { valid } from "semver";

/**
 * Fetch a specific version of an APM repo
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.4"
 */
export async function fetchVersion(
  provider: ethers.providers.Provider,
  dnpName: string,
  version?: string
): Promise<ApmVersionRaw> {
  const repo = new ethers.Contract(dnpName, repoContract.abi, provider);

  const res: ApmRepoVersionReturn =
    version && valid(version)
      ? await repo.getBySemanticVersion(toApmVersionArray(version))
      : await repo.getLatest();
  return parseApmVersionReturn(res);
}
