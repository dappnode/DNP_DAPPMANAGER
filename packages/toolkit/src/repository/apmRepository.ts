import { ethers } from "ethers";
import { valid, parse, validRange } from "semver";
import { ApmRepoVersionReturn, ApmVersionRawAndOrigin, ApmVersionState } from "./types.js";
import * as isIPFS from "is-ipfs";
import { isEnsDomain } from "../isEnsDomain.js";
import { repositoryAbi } from "./params.js";
import { MultiUrlJsonRpcProvider } from "../provider.js";
import { JsonRpcApiProvider } from "ethers";

/**
 * ApmRepository is a class to interact with the DAppNode APM Repository Contract.
 */
export class ApmRepository {
  private provider: JsonRpcApiProvider;

  /**
   * Class constructor
   * @param ethUrl - The URL of the Ethereum node to connect to.
   */
  constructor(provider: JsonRpcApiProvider) {
    this.provider = provider;
  }

  /**
   * Changes the Ethereum node to connect to.
   * @param ethUrl - The URL of the Ethereum node to connect to.
   */
  public changeEthProvider(ethersProvider: MultiUrlJsonRpcProvider): void {
    this.provider = ethersProvider;
  }

  /**
   * Fetches the smart contract address for the given DNP name
   * by resolving the ENS name.
   * Verifies that it resolves to a valid DappNodePackageDirectory contract.
   * @param dnpName - The name of the DNP to resolve.
   * @returns - A promise that resolves to the Repo instance.
   */
  public async getRepoContract(dnpName: string): Promise<ethers.Contract> {
    const contractAddress = await this.provider.resolveName(this.ensureValidDnpName(dnpName));

    // This error should include "NOREPO" in order to handle it properly in SDK publish code
    if (!contractAddress) throw new Error(`Could not resolve name ${dnpName}: NOREPO`);
    return new ethers.Contract(contractAddress, repositoryAbi, this.provider);
  }

  /**
   * Fetches the version and IPFS hash of a package.
   * If the version is not specified, it returns the latest version.
   * @param dnpNameOrHash - The name of the DNP or the IPFS hash.
   * @param version - The version of the DNP (optional).
   * @param contractAddress - The address of the repository contract (optional).
   * @returns - A promise that resolves to the raw APM version.
   */
  public async getVersionAndIpfsHash({
    dnpNameOrHash,
    version = "*",
    contractAddress
  }: {
    dnpNameOrHash: string;
    version?: string;
    contractAddress?: string;
  }): Promise<ApmVersionRawAndOrigin> {
    // Correct version
    if (version === "latest") version = "*";

    // Normal cases:
    // - name = eth domain & ver = semverVersion
    // - name = eth domain & ver = semverRange, [DO-NOT-CACHE] as the version is dynamic
    if (isEnsDomain(dnpNameOrHash) && (this.isSemver(version) || this.isSemverRange(version))) {
      let repoContract;
      if (contractAddress) {
        repoContract = new ethers.Contract(contractAddress, repositoryAbi, this.provider);
      } else {
        repoContract = await this.getRepoContract(dnpNameOrHash);
      }
      const res =
        version && valid(version)
          ? await repoContract.getBySemanticVersion(this.toApmVersionArray(version))
          : await repoContract.getLatest();

      return this.parseApmVersionReturn({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        semanticVersion: res[0].map((v: any) => parseInt(v.toString())),
        contractAddress: res[1],
        contentURI: res[2]
      });
    }

    // IPFS normal case, name = eth domain & ver = IPFS hash
    if (isEnsDomain(dnpNameOrHash) && this.isIpfsHash(version)) {
      return {
        version,
        contentUri: version,
        origin: version
      };
    }

    // When requesting IPFS hashes for the first time, their name is unknown
    // name = IPFS hash, ver = null
    if (this.isIpfsHash(dnpNameOrHash))
      return {
        version,
        contentUri: dnpNameOrHash,
        origin: dnpNameOrHash
      };

    // All other cases are invalid
    if (isEnsDomain(dnpNameOrHash)) throw Error(`Invalid version, must be a semver or a hash: ${version}`);
    else throw Error(`Invalid DNP name, must be a ENS domain: ${dnpNameOrHash}`);
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
   * Fetch all versions of an APM repo
   * If provided version request range, only returns satisfying versions
   * @param dnpName "bitcoin.dnp.dappnode.eth"
   */
  public async fetchApmVersionsState(dnpName: string, lastVersionId = 0): Promise<ApmVersionState[]> {
    const repo = new ethers.Contract(dnpName, repositoryAbi, this.provider);

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
    const versionIndexes = this.linspace(lastVersionId + 1, versionCount);
    return await Promise.all(
      versionIndexes.map(async (i): Promise<ApmVersionState> => {
        const versionData = await repo.getByVersionId(i).then(this.parseApmVersionReturn);
        return {
          ...versionData,
          versionId: i
        };
      })
    );
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
    if (!Array.isArray(res.semanticVersion)) throw Error(`property 'semanticVersion' must be an array`);
    return {
      version: res.semanticVersion.join("."),
      // Second argument = true: ignore UTF8 parsing errors
      // Let downstream code identify the content hash as wrong
      contentUri: ethers.toUtf8String(res.contentURI)
    };
  }

  /**
   * Ensures the DNP name ends under valid registries: dnp.dappnode.eth or public.dappnode.eth
   * @param dnpName - The name of the DNP.
   * @returns - The valid DNP name.
   */
  private ensureValidDnpName(dnpName: string): string {
    if (!isEnsDomain(dnpName)) throw Error(`Invalid ENS domain for dnpName ${dnpName}`);

    if (!dnpName.endsWith(".dappnode.eth")) throw Error(`Invalid dnpName ${dnpName}`);
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

  /**
   * Return evenly spaced numbers over a specified interval.
   * @param from 1
   * @param to 5
   * @param step 2
   * @returns [1, 3, 5]
   */
  private linspace(from: number, to: number, step = 1): number[] {
    // Guard against bugs that can cause // -Infinity
    if (!isFinite(from)) throw Error(`linspace 'from' is not finite: ${from}`);
    if (!isFinite(to)) throw Error(`linspace 'to' is not finite: ${to}`);
    const arr: number[] = [];
    for (let i = from; i <= to; i += step) arr.push(i);
    return arr;
  }
}
