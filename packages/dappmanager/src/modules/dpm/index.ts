import { ethers } from "ethers";
import semver from "semver";
import * as db from "../../db";
import { AddressHex } from "../../types";
import { fetchDpmRegistryPackage, Package } from "./registry";
import {
  fetchDnpRepoVersionSorting,
  fetchDpmRepoVersion,
  fetchDpmRepoVersions,
  VersionDpm,
  VersionDpmWithId,
  VersionSorting
} from "./repo";
import { getEthersProvider } from "../ethClient";
import params from "../../params";

export { fetchDpmRegistryPackages, Package } from "./registry";
export { fetchDpmRepoVersion, fetchDpmRepoVersions } from "./repo";

export const LATEST_VERSION_STR = "*";

type RepoAddress = string;
type VersionStr = string;

type VersionsCache = Map<VersionStr, VersionDpm>;

const versionsByStrByRepo = new Map<RepoAddress, VersionsCache>();

// Packages are referred by
// - Direct installs by searching for them
// - Dependencies that refer to other packages
// - The registry to list packages

// We don't use ENS anymore, so resolution must happen internally
// - A list of registry must be known in advance.
// - Then resolve registry name -> registryAddress
// - Then package name -> repoAddress with the registry contract

export function getRegistryAddress(registryName: string): AddressHex {
  const registryAddress = db.registryAddresses.get(registryName);
  if (!registryAddress) {
    // Allow to over-ride DAPPNODE_MAIN_REGISTRY_XDAI_NAME, otherwise always default to known value
    if (registryName === params.DAPPNODE_MAIN_REGISTRY_XDAI_NAME) {
      return params.DAPPNODE_MAIN_REGISTRY_XDAI_ADDRESS;
    } else {
      throw Error(`Unknown registry ${registryName}`);
    }
  }

  return registryAddress;
}

export class Dpm {
  provider: ethers.providers.Provider | undefined = undefined;

  async getProvider(): Promise<ethers.providers.Provider> {
    if (!this.provider) this.provider = await getEthersProvider();
    return this.provider;
  }

  /**
   * Fetch a specific version of an DPM repo
   * If version is falsy, gets the latest version
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   * @param versionStr "0.2.4"
   */
  async fetchVersion(
    dnpName: string,
    versionStr?: string
  ): Promise<VersionDpm> {
    const provider = await this.getProvider();
    const repoAddress = await this.resolveDnpNameToRepoAddress(dnpName);

    if (versionStr && versionStr !== LATEST_VERSION_STR) {
      return await fetchDpmRepoVersion(provider, repoAddress, versionStr);
    }

    // Note: Latest know is as clear as with previous APM contracts:
    // - versions may not be published in order, sorted by ID may not yield the actual latest
    // - `version` is an arbitrary string, it may not be sortable by semver logic
    else {
      const versionsByStr = await this.populateRepoVersionsCache(
        provider,
        repoAddress
      );

      const versionSorting = await fetchDnpRepoVersionSorting(
        provider,
        repoAddress
      );

      // Note: Depending on the version sorting algorythm do something different
      const maxVersionStr = sortLatestVersion(
        Array.from(versionsByStr.keys()),
        versionSorting
      );

      const version = versionsByStr.get(maxVersionStr);
      if (!version) {
        // Should never happen
        throw Error(`latest versionStr ${maxVersionStr} is unknown`);
      }

      return version;
    }
  }

  /**
   * Fetch all versions of an DPM repo
   * If provided version request range, only returns satisfying versions
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   */
  async fetchVersions(
    dnpName: string,
    lastVersionId?: number
  ): Promise<VersionDpmWithId[]> {
    return fetchDpmRepoVersions(
      await this.getProvider(),
      await this.resolveDnpNameToRepoAddress(dnpName),
      lastVersionId
    );
  }

  /**
   * Returns true if an DPM repo exists for a package dnpName
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   */
  async repoExists(dnpName: string): Promise<boolean> {
    // TODO: Optimize
    try {
      await this.resolveDnpNameToRepoAddress(dnpName);
      return true;
    } catch (e) {
      return false;
    }
  }

  async resolveDnpNameToPackage(dnpName: string): Promise<Package> {
    const dotIdx = dnpName.indexOf(".");
    if (dotIdx < 0) {
      throw Error(`Invalid dnpName ${dnpName} must contain the '.' character`);
    }

    const pkgName = dnpName.slice(0, dotIdx);
    const registryName = dnpName.slice(dotIdx + 1);
    const registryAddress = getRegistryAddress(registryName);

    return await fetchDpmRegistryPackage(
      await this.getProvider(),
      registryAddress,
      pkgName
    );
  }

  /**
   * Resolves a dnpNme to a repo address
   * @param dnpName `"bitcoin.dnp.dappnode.eth"`
   */
  async resolveDnpNameToRepoAddress(dnpName: string): Promise<AddressHex> {
    const pkg = await this.resolveDnpNameToPackage(dnpName);
    return pkg.repoAddress;
  }

  private async populateRepoVersionsCache(
    provider: ethers.providers.Provider,
    repoAddress: string
  ): Promise<VersionsCache> {
    // First sync up all versions
    let versionsByStr = versionsByStrByRepo.get(repoAddress);
    if (!versionsByStr) {
      versionsByStr = new Map();
      versionsByStrByRepo.set(repoAddress, versionsByStr);
    }

    const newVersions = await fetchDpmRepoVersions(
      provider,
      repoAddress,
      versionsByStr.size
    );

    for (const newVersion of newVersions) {
      versionsByStr.set(newVersion.version, newVersion);
    }

    return versionsByStr;
  }
}

export function sortLatestVersion(
  versionsStrs: VersionStr[],
  versionSorting: VersionSorting
): VersionStr {
  switch (versionSorting) {
    case VersionSorting.semver: {
      const versionStrSorted = versionsStrs.sort(semver.rcompare);
      return versionStrSorted[0];
    }

    case VersionSorting.alphabetical: {
      const versionStrSorted = versionsStrs.sort((a, b) => b.localeCompare(a));
      return versionStrSorted[0];
    }
  }
}
