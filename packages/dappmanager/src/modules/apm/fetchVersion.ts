import Web3 from "web3";
import { ApmRepoVersionReturn, ApmVersionRaw } from "./types";
import * as repoContract from "../../contracts/repository";
import { parseApmVersionReturn, toApmVersionArray } from "./apmUtils";
import semver from "semver";

/**
 * Fetch a specific version of an APM repo
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.4"
 */
export async function fetchVersion(
  web3: Web3,
  dnpName: string,
  version?: string
): Promise<ApmVersionRaw> {
  const repo = new web3.eth.Contract(repoContract.abi, dnpName);

  const res: ApmRepoVersionReturn =
    version && semver.valid(version)
      ? await repo.methods.getBySemanticVersion(toApmVersionArray(version))
      : await repo.methods.getLatest();
  return parseApmVersionReturn(res);
}
