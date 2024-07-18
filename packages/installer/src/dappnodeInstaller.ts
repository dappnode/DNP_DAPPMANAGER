import { params } from "@dappnode/params";
import { DappnodeRepository } from "@dappnode/toolkit";
import * as db from "@dappnode/db";
import {
  DistributedFile,
  IpfsClientTarget,
  PackageRelease,
  ManifestWithImage,
  Compose,
  Manifest,
  PackageRequest,
  SetupWizard,
  GrafanaDashboard,
  PrometheusTarget,
} from "@dappnode/types";
import { DappGetState, DappgetOptions, dappGet } from "./dappGet/index.js";
import {
  validateDappnodeCompose,
  validateManifestSchema,
} from "@dappnode/schemas";
import {
  ComposeEditor,
  setDappnodeComposeDefaults,
  writeMetadataToLabels,
} from "@dappnode/dockercompose";
import { computeGlobalEnvsFromDb } from "@dappnode/db";
import { getIsCore } from "@dappnode/utils";
import { sanitizeDependencies } from "./dappGet/utils/sanitizeDependencies.js";
import { parseTimeoutSeconds } from "./utils.js";
import { getEthersProvider, getEthUrl } from "./ethClient/index.js";
import { omit } from "lodash-es";
import { ethers } from "ethers";

/**
 * Returns the ipfsUrl to initialize the ipfs instance
 */
export function getIpfsUrl(): string {
  // Fort testing
  if (params.IPFS_HOST) return params.IPFS_HOST;

  const ipfsClientTarget = db.ipfsClientTarget.get();
  if (!ipfsClientTarget) throw Error("Ipfs client target is not set");
  // local
  if (ipfsClientTarget === IpfsClientTarget.local) return params.IPFS_LOCAL;
  // remote
  return db.ipfsGateway.get();
}

export class DappnodeInstaller extends DappnodeRepository {
  constructor(ipfsUrl: string, ethersProvider: ethers.JsonRpcProvider, timeout?: number) {
    super(ipfsUrl, ethersProvider, timeout);
  }

  private async updateProviders(): Promise<void> {
    const newIpfsUrl = getIpfsUrl();
    super.changeEthProvider(await getEthersProvider());
    super.changeIpfsProvider(newIpfsUrl);
  }

  /**
   * Get release assets for a request
   */
  async getRelease(name: string, version?: string): Promise<PackageRelease> {
    await this.updateProviders();

    const pkgRelease = await this.getPkgRelease({
      dnpNameOrHash: name,
      trustedKeys: db.releaseKeysTrusted.get(),
      os: process.arch,
      version,
    });

    // validate manifest and compose files
    this.validateManifestAndComposeSchemas(pkgRelease);

    // join metadata files in manifest
    pkgRelease.manifest = this.joinFilesInManifest({
      manifest: pkgRelease.manifest,
      disclaimer: pkgRelease.disclaimer,
      gettingStarted: pkgRelease.gettingStarted,
      grafanaDashboards: pkgRelease.grafanaDashboards,
      prometheusTargets: pkgRelease.prometheusTargets,
    });

    // set compose to custom dappnode compose in release
    pkgRelease.compose = this.addCustomDefaultsAndLabels(
      pkgRelease.compose,
      pkgRelease.manifest,
      pkgRelease.avatarFile,
      pkgRelease.origin
    );

    return pkgRelease;
  }

  /**
   * Get multiple release assets for multiple requests
   */
  async getReleases(packages: {
    [name: string]: string;
  }): Promise<PackageRelease[]> {
    await this.updateProviders();

    const pkgReleases = await this.getPkgsReleases(
      packages,
      db.releaseKeysTrusted.get(),
      process.arch
    );

    // validate manifest and compose files
    pkgReleases.forEach((pkgRelease) => {
      this.validateManifestAndComposeSchemas(pkgRelease);
    });

    // join metadata files in manifest
    pkgReleases.forEach((pkgRelease) => {
      pkgRelease.manifest = this.joinFilesInManifest({
        manifest: pkgRelease.manifest,
        SetupWizard: pkgRelease.setupWizard,
        disclaimer: pkgRelease.disclaimer,
        gettingStarted: pkgRelease.gettingStarted,
        grafanaDashboards: pkgRelease.grafanaDashboards,
        prometheusTargets: pkgRelease.prometheusTargets,
      });
    });

    // set compose to custom dappnode compose in each release
    pkgReleases.forEach((pkgRelease) => {
      pkgRelease.compose = this.addCustomDefaultsAndLabels(
        pkgRelease.compose,
        pkgRelease.manifest,
        pkgRelease.avatarFile,
        pkgRelease.origin
      );
    });

    return pkgReleases;
  }

  /**
   * Resolve a request dependencies and fetch their release assets
   */
  public async getReleasesResolved(
    req: PackageRequest,
    options?: DappgetOptions
  ): Promise<{
    releases: PackageRelease[];
    message: string;
    state: DappGetState;
    alreadyUpdated: DappGetState;
    currentVersions: DappGetState;
  }> {
    const result = await dappGet(this, req, options);
    const releases = await this.getReleases(result.state);
    return {
      ...result,
      releases,
    };
  }

  private joinFilesInManifest({
    manifest,
    SetupWizard,
    disclaimer,
    gettingStarted,
    prometheusTargets,
    grafanaDashboards,
  }: {
    manifest: Manifest;
    SetupWizard?: SetupWizard;
    disclaimer?: string;
    gettingStarted?: string;
    prometheusTargets?: PrometheusTarget[];
    grafanaDashboards?: GrafanaDashboard[];
  }): Manifest {
    if (SetupWizard) manifest.setupWizard = SetupWizard;
    if (disclaimer) manifest.disclaimer = { message: disclaimer };
    if (gettingStarted) manifest.gettingStarted = gettingStarted;
    if (prometheusTargets) manifest.prometheusTargets = prometheusTargets;
    if (grafanaDashboards && grafanaDashboards.length > 0)
      manifest.grafanaDashboards = grafanaDashboards;

    return manifest;
  }

  /**
   * Validates manifest and compose schemas
   */
  private validateManifestAndComposeSchemas(pkgRelease: PackageRelease): void {
    validateManifestSchema(pkgRelease.manifest);
    validateDappnodeCompose(pkgRelease.compose, pkgRelease.manifest);
  }

  /**
   * Adds custom labels to the compose
   */
  private addCustomDefaultsAndLabels(
    compose: Compose,
    manifest: Manifest,
    avatarFile: DistributedFile | undefined,
    origin?: string
  ): Compose {
    const customCompose = new ComposeEditor(
      setDappnodeComposeDefaults(compose, manifest)
    );

    const services = Object.values(customCompose.services());
    const globalEnvsFromDbPrefixed = computeGlobalEnvsFromDb(true);
    const isCore = getIsCore(manifest);
    const metadata = this.parseMetadataFromManifest(manifest);
    for (const service of services) {
      service.setGlobalEnvs(
        manifest.globalEnvs,
        globalEnvsFromDbPrefixed,
        isCore
      );

      service.mergeLabels(
        writeMetadataToLabels({
          dnpName: manifest.name,
          version: manifest.version,
          serviceName: service.serviceName,
          dependencies: sanitizeDependencies(metadata.dependencies || {}),
          avatar: this.fileToMultiaddress(avatarFile),
          chain: metadata.chain,
          origin,
          isCore,
          isMain:
            // If developer chooses this service as main
            metadata.mainService === service.serviceName ||
            // Or if there is a single service
            services.length === 1
              ? true
              : undefined,
          dockerTimeout: parseTimeoutSeconds(metadata.dockerTimeout),
        })
      );
    }
    return customCompose.compose;
  }

  /**
   * Stringifies a distributed file type into a single multiaddress string
   * @param distributedFile
   * @returns multiaddress "/ipfs/Qm"
   */
  private fileToMultiaddress(distributedFile?: DistributedFile): string {
    if (!distributedFile || !distributedFile.hash) return "";

    if (distributedFile.source === "ipfs")
      return `/ipfs/${this.normalizeHash(distributedFile.hash)}`;
    else return "";
  }

  /**
   * Normalizes a hash removing it's prefixes
   * - Remove any number of trailing slashes
   * - Split by non alphanumeric character and return the last string
   * "/ipfs/Qm" => "Qm"
   * "ipfs"
   * @param hash "/ipfs/Qm" | "ipfs:Qm" | "Qm"
   * @returns "Qm"
   */
  private normalizeHash(hash: string): string {
    return (
      hash
        // remove any number of trailing slashes
        .replace(/\/+$/, "")
        .trim()
        //
        .split(/[^a-zA-Z\d]/)
        .slice(-1)[0]
    );
  }

  /**
   * Sanitize metadata from the manifest.
   * Since metadata is not used for critical purposes, it can just
   * be copied over
   *
   * @param manifest
   */
  private parseMetadataFromManifest(manifest: Manifest): Manifest {
    const setupWizard = manifest.setupWizard ? manifest.setupWizard : undefined;

    return {
      // TODO: research if this omit can be removed since none packages should have been publish with this
      // format from long time ago
      ...omit(manifest as ManifestWithImage, [
        "avatar",
        "image",
        "setupSchema",
        "setupTarget",
        "setupUiJson",
      ]),
      ...(setupWizard ? { setupWizard } : {}),
      // ##### Is this necessary? Correct manifest: type missing
      type: manifest.type || "service",
    };
  }
}
