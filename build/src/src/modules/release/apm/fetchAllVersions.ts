import semver from "semver";
import { ethers } from "ethers";
import { getEthersProvider } from "../../ethProvider";
import { ApmVersion } from "../../../types";
import * as repoContract from "../../../contracts/repository";
import { parseApmVersionReturn, linspace } from "./apmUtils";

/**
 * Fetch all versions of an APM repo
 * If provided version request range, only returns satisfying versions
 * @param name "bitcoin.dnp.dappnode.eth"
 * @param verReq "^0.2.0"
 */
export default async function fetchAllVersions(
  name: string,
  verReq = "*"
): Promise<ApmVersion[]> {
  // If verReq is invalid, default to all versions
  if (!semver.validRange(verReq)) verReq = "*";

  const provider = getEthersProvider();
  const repo = new ethers.Contract(name, repoContract.abi, provider);

  const versionCount: number = await repo.getVersionsCount().then(parseFloat);

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
  const versionIndexes = linspace(1, versionCount);
  const allVersions: ApmVersion[] = await Promise.all(
    versionIndexes.map(
      async i => await repo.getByVersionId(i).then(parseApmVersionReturn)
    )
  );

  return allVersions
    .filter(({ version }) => semver.satisfies(version, verReq))
    .sort((v1, v2) => semver.rcompare(v1.version, v2.version));
}
