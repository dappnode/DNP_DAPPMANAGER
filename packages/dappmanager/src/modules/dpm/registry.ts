import { ethers } from "ethers";
import { AddressHex } from "../../types";
import { registryAbi } from "./registryAbi";

export enum Flags {
  active = "active",
  validated = "validated",
  banned = "banned",
  hidden = "hidden"
}

export type Package = {
  repoAddress: string;
  repoName: string;
  flags: Record<Flags, boolean>;
};

/** Repo contract struct type */
type PackageDpm = {
  flags: number;
  repo: string;
  name: string;
};

/**
 * Fetch all packages
 * If provided version request range, only returns satisfying versions
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 */
export async function fetchDpmRegistryPackages(
  provider: ethers.providers.Provider,
  registryAddress: AddressHex
): Promise<{ packages: Package[]; packageList: number[] }> {
  const registry = new ethers.Contract(registryAddress, registryAbi, provider);

  // Fetch packages

  // function getPackageCount() public view returns (uint256)
  const packageCountBn = await registry.getPackageCount();
  const packageCount = packageCountBn.toNumber();

  // Versions called by id are ordered in ascending order.
  // The min version = 1 and the latest = versionCount
  const indexes: number[] = [];
  for (let i = 1; i <= packageCount; i++) {
    indexes.push(i);
  }

  const packages: PackageDpm[] = await Promise.all(
    // mapping(uint256 => Package) public packages
    indexes.map(index => registry.packages(index))
  );

  // Fetch list

  /**
   * @dev Bytes per list item in packed bytes `packageList`.
   * Refer to `packageList` for examples
   */
  // uint64 public bytesPerListItem;
  const bytesPerListItemBn = await registry.bytesPerListItem();

  /**
   * @dev Compact list of packageIdx'es in some order. This list may signal
   * ordering for quality, relevance, etc.
   *
   * For example, to represent the list [1,2]:
   * | bytesPerListItem | packageList |
   * | ---------------- | ----------- |
   * | 1                | 0x0102      |
   * | 2                | 0x00010002  |
   *
   * This allows to support very big registries while keeping small lists cheap.
   */
  // bytes public packageList;
  const packageListHex = await registry.packageList();

  const bytesPerListItem = bytesPerListItemBn.toNumber();
  const packageList = parsePackageListHex(packageListHex, bytesPerListItem);

  return {
    packages: packages.map(pkg => ({
      flags: parseFlags(pkg.flags),
      // Drop array index keys from ethers
      repoAddress: pkg.repo,
      repoName: pkg.name
    })),
    packageList
  };
}

export async function fetchDpmRegistryPackage(
  provider: ethers.providers.Provider,
  registryAddress: AddressHex,
  packageName: string
): Promise<Package> {
  const registry = new ethers.Contract(registryAddress, registryAbi, provider);

  // function getPackage(string memory _name) public view returns (Package memory)
  const pkg = (await registry.getPackage(packageName)) as PackageDpm;
  // Drop array index keys from ethers
  return {
    flags: parseFlags(pkg.flags),
    repoAddress: pkg.repo,
    repoName: pkg.name
  };
}

export function parsePackageListHex(
  packageListHex: string,
  bytesPerListItem: number
): number[] {
  if (packageListHex.startsWith("0x")) packageListHex = packageListHex.slice(2);

  const indexes: number[] = [];
  const listLen = Math.ceil(packageListHex.length / bytesPerListItem / 2);

  for (let i = 0; i < listLen; i++) {
    const indexHex = packageListHex.slice(
      i * 2 * bytesPerListItem,
      (i + 1) * 2 * bytesPerListItem
    );
    const index = parseInt(indexHex, 16);
    indexes.push(index);
  }

  return indexes;
}

export function parseFlags(flags: number): Record<Flags, boolean> {
  return {
    active: (flags & 1) === 1,
    validated: (flags & 2) === 2,
    banned: (flags & 4) === 4,
    hidden: (flags & 8) === 8
  };
}

export function sortWithPackageList<T>(
  packageList: number[],
  values: T[]
): T[] {
  const valuesSorted: typeof values = [];

  // First push the packages listed in packageList
  for (const index of packageList) {
    if (index < values.length) {
      valuesSorted.push(values[index]);
    }
  }

  // Then push the rest of packages expect the already pushed
  const packageListSet = new Set(packageList);
  for (let i = 0; i < values.length; i++) {
    if (!packageListSet.has(i)) {
      valuesSorted.push(values[i]);
    }
  }

  return valuesSorted;
}
