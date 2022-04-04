import { ethers } from "ethers";
import * as db from "../../db";
import { AddressHex, EIP3770Address, EIP3770AddressStr } from "../../types";
import { fetchDpmRegistryPackage, Package } from "./registry";
import {
  fetchDnpRepoVersionSorting,
  fetchDpmRepoVersion,
  fetchDpmRepoVersions,
  sortLatestVersion,
  VersionDpm,
  VersionDpmWithId
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
  let registryEIP3770Address = db.registryEIP3770Addresses.get(registryName);

  if (!registryEIP3770Address) {
    registryEIP3770Address =
      params.DAPPNODE_KNOWN_REGISTRIES[
        registryName as keyof typeof params.DAPPNODE_KNOWN_REGISTRIES
      ];
    // Allow to over-ride known registries, otherwise always default to known value
    if (!registryEIP3770Address) {
      throw Error(`Unknown registry ${registryName}`);
    }
  }

  const { chainId, address } = parseEIP3770Address(registryEIP3770Address);

  // TODO: Support more chainIds
  if (chainId !== "xdai" && chainId !== "gno") {
    throw Error(`Unsupported registry chainId ${chainId}`);
  }

  return address;
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
        versionSorting,
        Array.from(versionsByStr.keys())
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

function parseEIP3770Address(
  eip3770AddressStr: EIP3770AddressStr
): EIP3770Address {
  // EIP-3770: Chain-specific addresses https://eips.ethereum.org/EIPS/eip-3770
  // xdai:0x01c58A553F92A61Fd713e6006fa7D1d82044c389
  const chrIdx = eip3770AddressStr.indexOf(":");
  if (chrIdx < 0) {
    throw Error(`Invalid EIP-3770 address no ':' ${eip3770AddressStr}`);
  }

  const chainId = eip3770AddressStr.slice(0, chrIdx);
  const address = eip3770AddressStr.slice(chrIdx + 1);

  return { chainId, address };
}
