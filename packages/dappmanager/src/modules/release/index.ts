import resolveReleaseName from "./resolveReleaseName.js";
import { getRelease } from "./getRelease.js";
import { getManifest } from "./getManifest.js";
import { PackageRequest } from "../../types.js";
import dappGet, { DappgetOptions } from "../dappGet/index.js";
import { Apm } from "../apm/index.js";
import { Manifest } from "@dappnode/types";
import { DappGetState } from "../dappGet/types.js";
import { PackageRelease } from "@dappnode/common";

export class ReleaseFetcher extends Apm {
  /**
   * Resolves name + version to an IPFS hash
   */
  async resolveReleaseName(
    name: string,
    version?: string
  ): Promise<{
    hash: string;
    origin?: string | undefined;
  }> {
    return await resolveReleaseName(this, name, version);
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
      Object.entries(packages).map(
        async ([name, version]) => await this.getRelease(name, version)
      )
    );
  }

  /**
   * Resolve a request dependencies and fetch their release assets
   */
  async getReleasesResolved(
    req: PackageRequest,
    options?: DappgetOptions
  ): Promise<{
    releases: PackageRelease[];
    message: string;
    state: DappGetState;
    alreadyUpdated: DappGetState;
    currentVersions: DappGetState;
  }> {
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
