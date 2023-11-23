import { ethers } from "ethers";
import { valid, parse } from "semver";
import { Repo__factory, Repo } from "../typechain/index.js";
import { ApmRepoVersionReturn, ApmVersionRaw } from "./types.js";
import { isEnsDomain } from "../utils.js";

/**
 * ApmRepository is a class to interact with the DAppNode APM Repository Contract.
 */
export class ApmRepository {
  private ethProvider: ethers.Provider;

  /**
   * Class constructor
   * @param ethUrl - The URL of the Ethereum node to connect to.
   */
  constructor(ethUrl: string) {
    if (!ethUrl) throw new Error("Ethereum URL is required");
    this.ethProvider = new ethers.JsonRpcProvider(ethUrl, "mainnet");
  }

  /**
   * Changes the Ethereum node to connect to.
   * @param ethUrl - The URL of the Ethereum node to connect to.
   */
  public changeEthProvider(ethUrl: string): void {
    if (!ethUrl) throw new Error("Ethereum URL is required");
    this.ethProvider = new ethers.JsonRpcProvider(ethUrl, "mainnet");
  }

  /**
   * Fetches the smart contract address for the given DNP name
   * by resolving the ENS name.
   * Verifies that it resolves to a valid DappNodePackageDirectory contract.
   * @param dnpName - The name of the DNP to resolve.
   * @returns - A promise that resolves to the Repo instance.
   */
  public async getRepoContract(dnpName: string): Promise<Repo> {
    const contractAddress = await this.ethProvider.resolveName(
      this.ensureValidDnpName(dnpName)
    );

    // This error should include "NOREPO" in order to handle it properly in SDK publish code
    if (!contractAddress)
      throw new Error(`Could not resolve name ${dnpName}: NOREPO`);
    return Repo__factory.connect(contractAddress, this.ethProvider);
  }

  /**
   * Fetches the version and IPFS hash of a package.
   * If the version is not specified, it returns the latest version.
   * @param dnpName - The name of the DNP.
   * @param version - The version of the DNP (optional).
   * @returns - A promise that resolves to the raw APM version.
   */
  public async getVersionAndIpfsHash({
    dnpName,
    version,
  }: {
    dnpName: string;
    version?: string;
  }): Promise<ApmVersionRaw> {
    const repoContract = await this.getRepoContract(dnpName);
    const res =
      version && valid(version)
        ? await repoContract.getBySemanticVersion(
            this.toApmVersionArray(version)
          )
        : await repoContract.getLatest();

    return this.parseApmVersionReturn({
      semanticVersion: res[0].map((v) => parseInt(v.toString())),
      contractAddress: res[1],
      contentURI: res[2],
    });
  }

  /**
   * Converts a semantic version string into the APM version array format.
   * @param version - The semantic version string.
   * @returns - The APM version array.
   */
  private toApmVersionArray(version: string): [number, number, number] {
    const semverObj = parse(version);
    if (!semverObj) throw Error(`Invalid semver ${version}`);
    return [semverObj.major, semverObj.minor, semverObj.patch];
  }

  /**
   * Parses the raw version response from an APM repo.
   * @param res - The raw version response from the APM repo.
   * @returns - The parsed APM version.
   */
  private parseApmVersionReturn(res: ApmRepoVersionReturn): {
    version: string;
    contentUri: string;
  } {
    if (!Array.isArray(res.semanticVersion))
      throw Error(`property 'semanticVersion' must be an array`);
    return {
      version: res.semanticVersion.join("."),
      // Second argument = true: ignore UTF8 parsing errors
      // Let downstream code identify the content hash as wrong
      contentUri: ethers.toUtf8String(res.contentURI),
    };
  }

  /**
   * Ensures the DNP name ends under valid registries: dnp.dappnode.eth or public.dappnode.eth
   * @param dnpName - The name of the DNP.
   * @returns - The valid DNP name.
   */
  private ensureValidDnpName(dnpName: string): string {
    if (!isEnsDomain(dnpName))
      throw Error(`Invalid ENS domain for dnpName ${dnpName}`);

    if (!dnpName.endsWith(".dappnode.eth"))
      throw Error(`Invalid dnpName ${dnpName}`);
    return dnpName;
  }
}
