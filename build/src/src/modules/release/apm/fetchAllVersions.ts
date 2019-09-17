import semver from "semver";
import web3 from "../../web3Setup";
import fetchRepoAddress from "./fetchRepoAddress";
import { ApmVersion } from "../../../types";
import * as repoContract from "../../../contracts/repository";
import parseResult from "./parseResult";
import Logs from "../../../logs";
const logs = Logs(module);

/**
 * Versions
 *
 * @param {*} packageReq
 * @param {*} verReq
 * @returns {*}
 */
export default async function fetchAllVersions(
  name: string,
  verReq: string
): Promise<ApmVersion[]> {
  // If verReq is not provided or invalid, default to all versions
  if (!verReq || semver.validRange(verReq)) verReq = "*";

  const repoAddr = await fetchRepoAddress(name);
  const repo = new web3.eth.Contract(repoContract.abi, repoAddr);

  const versionCount = parseFloat(await repo.methods.getVersionsCount().call());

  /**
   * Versions called by id are ordered in ascending order.
   * The min version = 1 and the latest = versionCount
   *
   *  i | semanticVersion
   * ---|------------------
   *  1 | [ '0', '1', '0' ]
   *  2 | [ '0', '1', '1' ]
   *  3 | [ '0', '1', '2' ]
   *  4 | [ '0', '2', '0' ]
   *
   * versionIndexes = [1, 2, 3, 4, 5, ...]
   */
  const versionIndexes = [...Array(versionCount).keys()].map(i => i + 1);
  const allVersions: ApmVersion[] = [];
  await Promise.all(
    versionIndexes.map(async i => {
      try {
        const res = await repo.methods.getByVersionId(i).call();
        // semanticVersion = [1, 0, 8]. It is joined to form a regular semver string
        allVersions.push(parseResult(res));
      } catch (e) {
        // If you request an inexistent ID to the contract, web3 will throw
        // Error: couldn't decode uint16 from ABI. The try, catch block will catch that
        // and log other errors
        if (e.message.includes("decode uint16 from ABI")) {
          logs.error("Attempting to fetch an inexistent version");
        } else {
          logs.error(`Error getting versions of ${name}: ${e.stack}`);
        }
      }
    })
  );

  return allVersions
    .filter(({ version }) => semver.satisfies(version, verReq))
    .sort((v1, v2) => semver.rcompare(v1.version, v2.version));
}
