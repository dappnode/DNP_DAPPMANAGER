import { ethers } from "ethers";
import { AddressHex } from "../../types";
import { repoAbi } from "./repoAbi";

export type VersionDpm = {
  /** `'1.0.1'` */
  version: string;
  /** `'/ipfs/Qmc3Kt4BuM84kEy3ojZMKXjSDPi1HNu8m5tyDvW9KaKaYu'` */
  contentUri: string;
};

export type VersionDpmWithId = VersionDpm & {
  /** Version ID in Repo contract. Min version has id = 1 */
  id: number;
};

/**
 * Fetch versions of a DPM from `lastVersionId`. Note that the first version has id = 1.
 * Versions are immutable and only new versions can be added. Versions are safe to cache,
 * after considering re-orgs.
 */
export async function fetchDpmRepoVersions(
  provider: ethers.providers.Provider,
  repoAddress: AddressHex,
  lastVersionId?: number
): Promise<VersionDpmWithId[]> {
  const repo = new ethers.Contract(repoAddress, repoAbi, provider);

  // function getVersionsCount() public view returns (uint256)
  const versionCountBn = await repo.getVersionsCount();
  const versionCount = versionCountBn.toNumber();

  // Versions called by id are ordered in ascending order.
  // The min version = 1 and the latest = versionCount
  const ids: number[] = [];
  for (let i = lastVersionId ?? 1; i <= versionCount; i++) {
    ids.push(i);
  }

  // function getByVersionId(uint256 _versionId) public view returns (Version memory)
  return await Promise.all(
    ids.map(async id => {
      const version = (await repo.getByVersionId(id)) as VersionDpm;
      return {
        id,
        version: version.version,
        contentUri: version.contentUri
      };
    })
  );
}

/**
 * Fetch a specific version of a DPM.
 */
export async function fetchDpmRepoVersion(
  provider: ethers.providers.Provider,
  repoAddress: AddressHex,
  versionStr: string
): Promise<VersionDpm> {
  const repo = new ethers.Contract(repoAddress, repoAbi, provider);

  // function getBySemanticVersion(string memory _version) public view returns (Version memory)
  const version = (await repo.getBySemanticVersion(versionStr)) as VersionDpm;

  return {
    version: version.version,
    contentUri: version.contentUri
  };
}

/**
 * Fetch the last published version. Does not mean LATEST in semver terms
 */
export async function fetchDnpRepoLastPublishedVersion(
  provider: ethers.providers.Provider,
  repoAddress: AddressHex
): Promise<VersionDpm> {
  const repo = new ethers.Contract(repoAddress, repoAbi, provider);

  // function getLastPublished() public view returns (Version memory)
  const version = (await repo.getLastPublished()) as VersionDpm;

  return {
    version: version.version,
    contentUri: version.contentUri
  };
}
