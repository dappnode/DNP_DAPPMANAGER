import { ethers } from "ethers";
import { AddressHex } from "../../types";
import { repoAbi } from "./repoAbi";

export type VersionDpm = {
  /** `'1.0.1'` */
  version: string;
  /** `'ipfs://Qmc3Kt4BuM84kEy3ojZMKXjSDPi1HNu8m5tyDvW9KaKaYu'` */
  contentUris: string[];
};

export type VersionDpmWithId = VersionDpm & {
  /** Version ID in Repo contract. Min version has id = 1 */
  id: number;
};

export enum VersionSorting {
  semver = 0,
  alphabetical = 1
}

/**
 * Fetch versions of a DPM from `lastVersionId`. Note that the first version has id = 1.
 * Versions are immutable and only new versions can be added. Versions are safe to cache,
 * after considering re-orgs.
 */
export async function fetchDpmRepoVersions(
  provider: ethers.providers.Provider,
  repoAddress: AddressHex,
  prevVersionCount = 0
): Promise<VersionDpmWithId[]> {
  const repo = new ethers.Contract(repoAddress, repoAbi, provider);

  // function getVersionsCount() public view returns (uint256)
  const versionCountBn = await repo.getVersionsCount();
  const versionCount = versionCountBn.toNumber();

  if (prevVersionCount === versionCount) {
    return [];
  }

  // Versions called by id are ordered in ascending order.
  // The min version = 1 and the latest = versionCount
  const ids: number[] = [];
  for (let i = prevVersionCount + 1; i <= versionCount; i++) {
    ids.push(i);
  }

  // function getByVersionId(uint256 _versionId) public view returns (Version memory)
  return await Promise.all(
    ids.map(async id => {
      const version = (await repo.getByVersionId(id)) as VersionDpm;
      return { id, ...parseVersionDpm(version) };
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
  return parseVersionDpm(version);
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
  return parseVersionDpm(version);
}

export async function fetchDnpRepoVersionSorting(
  provider: ethers.providers.Provider,
  repoAddress: AddressHex
): Promise<VersionSorting> {
  const repo = new ethers.Contract(repoAddress, repoAbi, provider);

  // uint256 public versionSorting;
  const versionSortingBn = await repo.versionSorting();
  const versionSorting = versionSortingBn.toNumber();

  if (VersionSorting[versionSorting] === undefined) {
    throw Error(`Unknown version sorting ${versionSorting}`);
  }

  return versionSorting;
}

function parseVersionDpm(version: VersionDpm): VersionDpm {
  // Drop extra properties from ethers value return
  return {
    version: version.version,
    contentUris: version.contentUris
  };
}
