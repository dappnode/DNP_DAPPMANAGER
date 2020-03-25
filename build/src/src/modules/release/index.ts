import resolveReleaseName from "./resolveReleaseName";
import { getReleaseFromIpfs } from "./getRelease";
import { getManifest } from "./getManifest";
import { PackageRelease, PackageRequest, Manifest } from "../../types";
import dappGet, { DappgetOptions } from "../dappGet";
import { Apm } from "../apm";

type PackageReleases = { [name: string]: PackageRelease };

export class ReleaseFetcher extends Apm {
  /**
   * Resolves name + version to an IPFS hash
   */
  async resolveReleaseName(name: string, version?: string) {
    return resolveReleaseName(this, name, version);
  }

  /**
   * Get release assets for a request
   */
  async getRelease(name: string, version?: string): Promise<PackageRelease> {
    const { hash, origin } = await this.resolveReleaseName(name, version);
    return await getReleaseFromIpfs({ hash, name, origin });
  }

  /**
   * Get multiple release assets for multiple requests
   */
  async getReleases(packages: {
    [name: string]: string;
  }): Promise<PackageReleases> {
    const releases: PackageReleases = {};
    await Promise.all(
      Object.entries(packages).map(async ([name, version]) => {
        releases[name] = await this.getRelease(name, version);
      })
    );
    return releases;
  }

  /**
   * Resolve a request dependencies and fetch their release assets
   */
  async getReleasesResolved(req: PackageRequest, options?: DappgetOptions) {
    const result = await dappGet(req, options);
    const releases = await this.getReleases(result.state);
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
