import { ethers } from "ethers";
import * as db from "../../db";
import { AddressHex } from "../../types";
import { fetchDpmRegistryPackage, Package } from "./registry";
import {
  fetchDnpRepoLastPublishedVersion,
  fetchDpmRepoVersion,
  fetchDpmRepoVersions,
  VersionDpm,
  VersionDpmWithId
} from "./repo";
import { getEthersProvider } from "../ethClient";
import params from "../../params";

export { fetchDpmRegistryPackages, Package } from "./registry";
export { fetchDpmRepoVersion, fetchDpmRepoVersions } from "./repo";

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
   * @param version "0.2.4"
   */
  async fetchVersion(dnpName: string, version?: string): Promise<VersionDpm> {
    const provider = await this.getProvider();
    const repoName = await this.resolveDnpNameToRepoAddress(dnpName);

    if (version) {
      return fetchDpmRepoVersion(provider, repoName, version);
    } else {
      // TODO: Latest know is not clear what it means:
      // - versions may not be published in order, sorted by ID may not yield the actual latest
      // - `version` is an arbitrary string, it may not be sortable by semver logic
      return fetchDnpRepoLastPublishedVersion(provider, repoName);
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
}
