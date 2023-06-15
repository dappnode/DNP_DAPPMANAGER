import { ethers } from "ethers";
import { ApmVersionState } from "./types.js";
import { repositoryAbi } from "@dappnode/toolkit";
import { parseApmVersionReturn, linspace } from "./apmUtils.js";

/**
 * Fetch all versions of an APM repo
 * If provided version request range, only returns satisfying versions
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 */
export async function fetchApmVersionsState(
  provider: ethers.providers.Provider,
  dnpName: string,
  lastVersionId = 0
): Promise<ApmVersionState[]> {
  const repo = new ethers.Contract(dnpName, repositoryAbi, provider);

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
  // Guard against bugs that can cause // negative values
  if (isNaN(lastVersionId) || lastVersionId < 0) lastVersionId = 0;
  const versionIndexes = linspace(lastVersionId + 1, versionCount);
  return await Promise.all(
    versionIndexes.map(async (i): Promise<ApmVersionState> => {
      const versionData = await repo
        .getByVersionId(i)
        .then(parseApmVersionReturn);
      return {
        ...versionData,
        versionId: i
      };
    })
  );
}
