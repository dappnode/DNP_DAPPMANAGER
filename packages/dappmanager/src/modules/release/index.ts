import { getRelease } from "./getRelease";
import { getManifest } from "./getManifest";
import { PackageRelease, PackageRequest, Manifest } from "../../types";
import dappGet, { DappgetOptions } from "../dappGet";
import { Dpm, LATEST_VERSION_STR } from "../dpm";
import {
  isIpfsHash,
  isEnsDomain,
  isSemver,
  isSemverRange
} from "../../utils/validate";
import { DappGetState } from "../dappGet/types";

enum ContentProtocol {
  ipfs = "ipfs://",
  bzz = "bzz://"
}

export class ReleaseFetcher extends Dpm {
  /**
   * Resolves name + version to an IPFS hash
   */
  async resolveReleaseName(
    dnpName: string,
    version?: string
  ): Promise<{ hash: string; origin?: string }> {
    // Correct version
    if (!version || version === "latest" || version === "*") {
      version = LATEST_VERSION_STR;
    }

    if (
      // Normal case, name = eth domain & ver = semverVersion
      isEnsDomain(dnpName) &&
      // Normal case, name = eth domain & ver = semverRange, [DO-NOT-CACHE] as the version is dynamic
      (isSemver(version) || isSemverRange(version))
    ) {
      const versionDpm = await this.fetchVersion(dnpName, version);
      return {
        hash: findContentUri(versionDpm.contentURIs, ContentProtocol.ipfs)
      };
    }

    // IPFS normal case, name = eth domain & ver = IPFS hash
    if (isEnsDomain(dnpName) && isIpfsHash(version))
      return {
        hash: version,
        origin: version
      };

    // When requesting IPFS hashes for the first time, their name is unknown
    // name = IPFS hash, ver = null
    if (isIpfsHash(dnpName))
      return {
        hash: dnpName,
        origin: dnpName
      };

    // All other cases are invalid
    if (isEnsDomain(dnpName))
      throw Error(`Invalid version, must be a semver or a hash: ${version}`);
    else throw Error(`Invalid DNP name, must be a ENS domain: ${dnpName}`);
  }

  /**
   * Get release assets for a request
   */
  async getRelease(name: string, version?: string): Promise<PackageRelease> {
    const { hash, origin } = await this.resolveReleaseName(name, version);
    return await getRelease({ hash, name, origin });
  }

  /**
   * Resolve a request dependencies and fetch their release assets
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async getReleasesResolved(
    req: PackageRequest,
    options?: DappgetOptions
  ): Promise<{
    message: string;
    state: DappGetState;
    alreadyUpdated: DappGetState;
    currentVersions: DappGetState;
    releases: PackageRelease[];
  }> {
    const result = await dappGet(req, options);
    const releases = await Promise.all(
      Object.entries(result.state).map(([name, version]) =>
        this.getRelease(name, version)
      )
    );

    return {
      ...result,
      releases
    };
  }

  /**
   * Resolve a request and return only its manifest
   */
  async getManifest(name: string, version?: string): Promise<Manifest> {
    const { hash } = await this.resolveReleaseName(name, version);
    return await getManifest(hash);
  }
}

export function findContentUri(
  contentURIs: string[],
  contentProtocol: ContentProtocol
): string {
  for (const contentURI of contentURIs) {
    if (contentURI.startsWith(contentProtocol)) {
      return contentURI.slice(contentProtocol.length);
    }
  }

  throw Error(`No contentURI found for protocol ${contentProtocol}`);
}
