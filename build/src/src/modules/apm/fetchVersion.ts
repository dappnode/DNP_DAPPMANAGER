import { ethers } from "ethers";
import { ApmRepoVersionReturn } from "./types";
import * as repoContract from "../../contracts/repository";
import { parseApmVersionReturn, toApmVersionArray } from "./apmUtils";

/**
 * Fetch a specific version of an APM repo
 * @param name "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.4"
 */
export async function fetchVersion(
  provider: ethers.providers.Provider,
  name: string,
  version?: string
): Promise<{ version: string; contentUri: string }> {
  const repo = new ethers.Contract(name, repoContract.abi, provider);

  const res: ApmRepoVersionReturn = version
    ? await repo.getBySemanticVersion(toApmVersionArray(version))
    : repo.getLatest();
  return parseApmVersionReturn(res);
}
