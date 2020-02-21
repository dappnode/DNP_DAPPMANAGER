import semver from "semver";
import * as db from "../../../db";
import web3 from "../../web3Setup";
import { ApmVersion } from "../../../types";
import * as repoContract from "../../../contracts/repository";
import fetchRepoAddress from "./fetchRepoAddress";
import parseResult from "./parseResult";

/**
 * Fetches the latest version of a DNP
 * @param {object} packageReq { name: "bitcoin.dnp.dappnode.eth" }
 * @returns {string} latestVersion = "0.2.4"
 */
export default async function fetchVersion(
  name: string,
  version: string
): Promise<ApmVersion> {
  const semverObj = semver.parse(version);
  if (!semverObj) throw Error(`Invalid semver ${version}`);

  // Load cache if available
  const cachedResult = db.apmCache.get({ name, version });
  if (cachedResult) return cachedResult;

  const repoAddr = await fetchRepoAddress(name);
  const repo = new web3.eth.Contract(repoContract.abi, repoAddr);

  const apmVersion = await repo.methods
    .getBySemanticVersion([semverObj.major, semverObj.minor, semverObj.patch])
    .call()
    .then(parseResult);

  // Validate and store cache
  if (apmVersion.version === version)
    db.apmCache.set({ name, version }, apmVersion);

  return apmVersion;
}
