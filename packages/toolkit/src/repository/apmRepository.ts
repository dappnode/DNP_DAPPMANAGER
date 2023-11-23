import { ethers } from "ethers";
import { valid, parse, validRange } from "semver";
import { Repo__factory, Repo } from "../typechain/index.js";
import { ApmRepoVersionReturn, ApmVersionRawAndOrigin } from "./types.js";
import * as isIPFS from "is-ipfs";
import { isEnsDomain } from "@dappnode/utils";

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
   * @param dnpNameOrHash - The name of the DNP or the IPFS hash.
   * @param version - The version of the DNP (optional).
   * @returns - A promise that resolves to the raw APM version.
   */
  public async getVersionAndIpfsHash({
    dnpNameOrHash,
    version = "*",
  }: {
    dnpNameOrHash: string;
    version?: string;
  }): Promise<ApmVersionRawAndOrigin> {
    // Correct version
    if (version === "latest") version = "*";

    // Normal cases:
    // - name = eth domain & ver = semverVersion
    // - name = eth domain & ver = semverRange, [DO-NOT-CACHE] as the version is dynamic
    if (
      isEnsDomain(dnpNameOrHash) &&
      (this.isSemver(version) || this.isSemverRange(version))
    ) {
      const repoContract = await this.getRepoContract(dnpNameOrHash);
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

    // IPFS normal case, name = eth domain & ver = IPFS hash
    if (isEnsDomain(dnpNameOrHash) && this.isIpfsHash(version)) {
      return {
        version,
        contentUri: version,
        origin: version,
      };
    }

    // When requesting IPFS hashes for the first time, their name is unknown
    // name = IPFS hash, ver = null
    if (this.isIpfsHash(dnpNameOrHash))
      return {
        version,
        contentUri: dnpNameOrHash,
        origin: dnpNameOrHash,
      };

    // All other cases are invalid
    if (isEnsDomain(dnpNameOrHash))
      throw Error(`Invalid version, must be a semver or a hash: ${version}`);
    else throw Error(`Invalid DNP name, must be a ENS domain: ${name}`);
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

  /**
   * Checks if the given string is a valid IPFS CID or path
   *
   * isIPFS.cid('QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o') // true (CIDv0)
   * isIPFS.cid('zdj7WWeQ43G6JJvLWQWZpyHuAMq6uYWRjkBXFad11vE2LHhQ7') // true (CIDv1)
   * isIPFS.cid('noop') // false
   *
   * @param hash
   * @returns
   */
  private isIpfsHash(hash: string): boolean {
    if (!hash || typeof hash !== "string") return false;
    // Correct hash prefix

    // Remove `ipfs/` or `/ipfs/` prefix
    hash = hash.split("ipfs/")[1] || hash;
    // Remove trailing and leading slashes
    hash = hash.replace(/\/+$/, "").replace(/^\/+/, "");
    // Ignore any subpath after the hash
    hash = hash.split("/")[0];

    // Make sure hash if valid
    return isIPFS.cid(hash);
  }

  /**
   * Must accept regular semvers and "*"
   * @param version
   */
  private isSemver(version: string): boolean {
    return Boolean(valid(version));
  }

  /**
   * Must accept regular semvers and "*"
   * @param version
   */
  private isSemverRange(version: string): boolean {
    return Boolean(validRange(version));
  }
}
