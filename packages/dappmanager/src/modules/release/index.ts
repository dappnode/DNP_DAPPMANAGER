import resolveReleaseName from "./resolveReleaseName";
import { getRelease } from "./getRelease";
import { getManifest } from "./getManifest";
import { PackageRelease, PackageRequest, Manifest } from "../../types";
import dappGet, { DappgetOptions } from "../dappGet";
import { Apm } from "../apm";

export class ReleaseFetcher extends Apm {
  /**
   * Resolves name + version to an IPFS hash
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async resolveReleaseName(name: string, version?: string) {
    return resolveReleaseName(this, name, version);
  }

  /**
   * Get release assets for a request
   */
  async getRelease(name: string, version?: string): Promise<PackageRelease> {
    const { hash, origin } = await this.resolveReleaseName(name, version);
    return await getRelease({ hash, name, origin });
  }

  /**
   * Get multiple release assets for multiple requests
   */
  async getReleases(packages: {
    [name: string]: string;
  }): Promise<PackageRelease[]> {
    return await Promise.all(
      Object.entries(packages).map(([name, version]) =>
        this.getRelease(name, version)
      )
    );
  }

  /**
   * Resolve a request dependencies and fetch their release assets
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
