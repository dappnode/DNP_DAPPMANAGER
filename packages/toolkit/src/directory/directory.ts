import { ethers } from "ethers";
import {
  DAppNodePackageDirectory,
  DAppNodePackageDirectory__factory,
} from "../typechain/index.js";
import { DirectoryDnp, directoryDnpStatus } from "./types.js";
import { directoryAddress } from "./params.js";
import { isEnsDomain } from "../utils.js";

/**
 * DappNodeDirectory is a class to interact with the DAppNode Directory Contract.
 */
export class DappNodeDirectory {
  private directoryContract: DAppNodePackageDirectory;

  /**
   * Class constructor
   * @param ethUrl - The URL of the Ethereum node to connect to.
   */
  constructor(ethUrl: string) {
    this.directoryContract = DAppNodePackageDirectory__factory.connect(
      directoryAddress,
      new ethers.JsonRpcProvider(ethUrl, "mainnet")
    );
  }

  /**
   * Fetches all packages from the DAppNode Directory Contract.
   * @returns - A promise that resolves to an array of DirectoryDnp objects.
   */
  public async getDirectoryPkgs(): Promise<DirectoryDnp[]> {
    const numberOfDappnodePackages = await this.fetchNumberOfPackages();
    const featuredIndexes = await this.fetchFeaturedPackagesIndexes();

    const directoryPkgs = await this.fetchPackageDetails(
      numberOfDappnodePackages,
      featuredIndexes
    );

    return this.sortDirectoryPkgs(directoryPkgs);
  }

  /**
   * Fetches the number of Dappnode packages from the contract.
   * @returns - A promise that resolves to the number of Dappnode packages.
   */
  private async fetchNumberOfPackages(): Promise<number> {
    return parseInt(
      (await this.directoryContract.numberOfDAppNodePackages()).toString()
    );
  }

  /**
   * Fetches the indexes of featured packages from the contract.
   * @returns - A promise that resolves to an array of featured packages indexes.
   */
  private async fetchFeaturedPackagesIndexes(): Promise<number[]> {
    const featuredBytes = await this.directoryContract.featured();

    return (featuredBytes.replace("0x", "").match(/.{1,2}/g) ?? [])
      .filter((value: string) => value !== "00")
      .filter(
        (value: string, index: number, self: string[]) =>
          self.indexOf(value) === index
      )
      .map((base64: string) => parseInt(base64, 16));
  }

  /**
   * Fetches the details of all packages from the contract.
   * @param numberOfPackages - The total number of packages.
   * @param featuredIndexes - The indexes of featured packages.
   * @returns - A promise that resolves to an array of package details.
   */
  private async fetchPackageDetails(
    numberOfPackages: number,
    featuredIndexes: number[]
  ): Promise<DirectoryDnp[]> {
    const packageIndices = Array.from(
      { length: numberOfPackages },
      (_, i) => i
    );

    const packages = await Promise.all(
      packageIndices.map((i) => this.fetchPackageDetail(i, featuredIndexes))
    );

    return packages.filter(
      (dnp): dnp is DirectoryDnp => typeof dnp !== "undefined"
    );
  }

  /**
   * Fetches the details of a package from the contract.
   * @param index - The index of the package.
   * @param featuredIndexes - The indexes of featured packages.
   * @returns - A promise that resolves to the package details or undefined if there was an error.
   */
  private async fetchPackageDetail(
    index: number,
    featuredIndexes: number[]
  ): Promise<DirectoryDnp | undefined> {
    try {
      const {
        name,
        status: statusBn,
        position: positionBn,
      } = await this.directoryContract.getPackage(index);
      const status = parseInt(statusBn.toString());

      if (!isEnsDomain(name) || status === 0) return;

      const featuredIndex = featuredIndexes.indexOf(index);
      return {
        name,
        statusName: directoryDnpStatus[status],
        position: parseInt(positionBn.toString()),
        isFeatured: featuredIndex > -1,
        featuredIndex: featuredIndex,
      };
    } catch (e) {
      if (e instanceof Error)
        e.message = `Error retrieving DNP #${index} from directory ${e}`;
      console.log(e);
      return;
    }
  }

  /**
   * Sorts an array of DirectoryDnp objects.
   * First by the featured packages in order of their featured index,
   * then by the non-featured packages in descending order of their position.
   * @param dnps - An array of DirectoryDnp objects.
   * @returns - The sorted array of DirectoryDnp objects.
   */
  private sortDirectoryPkgs(dnps: DirectoryDnp[]): DirectoryDnp[] {
    const featured = dnps.filter((dnp) => dnp.isFeatured);
    const notFeatured = dnps.filter((dnp) => !dnp.isFeatured);
    return [
      ...featured.sort((a, b) => a.featuredIndex - b.featuredIndex),
      ...notFeatured.sort((a, b) => b.position - a.position),
    ];
  }
}
