import { AsyncLocalStorage } from "node:async_hooks";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { DappnodeRepository, VerifiedRegistryClient, RegistrySession, normalizeReleaseCid } from "@dappnode/toolkit";
import type { ApmVersionRawAndOrigin, ApmVersionState } from "@dappnode/toolkit";
import { validRange } from "semver";
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
  NotificationsConfig,
  RegistryVerification,
  releaseFilesToDownload
} from "@dappnode/types";
import { DappGetState, DappgetOptions, dappGet } from "./dappGet/index.js";
import {
  validateDappnodeCompose,
  validateManifestSchema,
  validateNotificationsSchema,
  validateSetupWizardSchema
} from "@dappnode/schemas";
import { ComposeEditor, setDappnodeComposeDefaults, writeMetadataToLabels } from "@dappnode/dockercompose";
import { computeGlobalEnvsFromDb } from "@dappnode/db";
import { fileToGatewayUrl, getIsCore } from "@dappnode/utils";
import { sanitizeDependencies } from "./dappGet/utils/sanitizeDependencies.js";
import { parseTimeoutSeconds } from "./utils.js";
import { omit } from "lodash-es";
import { JsonRpcApiProvider } from "ethers";

/**
 * Returns the ipfsUrl to initialize the ipfs instance
 */
export function getIpfsUrls(): string[] {
  // Fort testing
  if (params.IPFS_HOST) return [params.IPFS_HOST];

  const ipfsClientTarget = db.ipfsClientTarget.get();
  if (!ipfsClientTarget) throw Error("Ipfs client target is not set");
  // local
  if (ipfsClientTarget === IpfsClientTarget.local) return [params.IPFS_LOCAL];
  // remote
  return db.getIpfsGateways();
}

export class DappnodeInstaller extends DappnodeRepository {
  private readonly registrySessions = new AsyncLocalStorage<RegistrySession>();

  constructor(
    ipfsUrl: string | string[],
    provider: JsonRpcApiProvider,
    private readonly registryVerifier = new VerifiedRegistryClient({
      async request() {
        throw new Error("CHAIN VERIFICATION: configure the managed light client and a trusted checkpoint");
      }
    })
  ) {
    super(
      ipfsUrl,
      provider,
      {
        baseUrl: params.CONTENT_MIRROR_BASE_URL,
        timeoutMs: params.CONTENT_MIRROR_TIMEOUT_MS,
        maxBytes: params.CONTENT_MIRROR_MAX_BYTES
      },
      () => false,
      (level, message) => logs[level](message)
    );
  }

  /** Keep concurrent installs isolated while sharing one snapshot throughout dependency resolution. */
  private async withRegistry<T>(operation: (session: RegistrySession) => Promise<T>): Promise<T> {
    const active = this.registrySessions.getStore();
    if (active) return operation(active);
    const session = await this.registryVerifier.begin();
    return this.registrySessions.run(session, () => operation(session));
  }

  override async getVersionAndIpfsHash(
    args: Parameters<DappnodeRepository["getVersionAndIpfsHash"]>[0]
  ): Promise<ApmVersionRawAndOrigin> {
    return this.withRegistry(async (session) => {
      const { dnpNameOrHash, version = "*", contractAddress } = args;
      if (dnpNameOrHash.endsWith(".dappnode.eth") && (version === "latest" || validRange(version))) {
        const proof = await session.resolve(dnpNameOrHash, version);
        if (contractAddress && contractAddress.toLowerCase() !== proof.repositoryAddress.toLowerCase()) {
          throw new Error(`CHAIN VERIFICATION: repository address changed for ${dnpNameOrHash}`);
        }
        return { version: proof.version, contentUri: proof.cid };
      }
      // Direct CIDs are authenticated first, then checked for registration using the manifest identity.
      const result = await super.getVersionAndIpfsHash(args);
      const entries = await this.list(result.contentUri);
      const manifest = await this.getPkgAsset<Manifest>(releaseFilesToDownload.manifest, {
        source: "ipfs",
        entries,
        packageCidStr: result.contentUri
      });
      if (!manifest) throw new Error("Missing release manifest");
      validateManifestSchema(manifest);
      if (dnpNameOrHash.endsWith(".dappnode.eth") && dnpNameOrHash !== manifest.name) {
        throw new Error("CHAIN VERIFICATION: requested name differs from manifest");
      }
      const proof = await session.resolve(manifest.name, manifest.version);
      if (normalizeReleaseCid(result.contentUri) !== proof.cid) {
        throw new Error(
          "CHAIN VERIFICATION: CID has no matching registry record; use the explicit developer install path"
        );
      }
      return { ...result, version: proof.version, contentUri: proof.cid };
    });
  }

  override async getRepoContract(name: string) {
    return this.withRegistry((session) => session.contract(name));
  }

  override async fetchApmVersionsState(name: string, lastVersionId = 0): Promise<ApmVersionState[]> {
    return this.withRegistry((session) => session.versions(name, lastVersionId));
  }

  override async getManifestFromDir(name: string, version?: string): Promise<Manifest> {
    return this.withRegistry(async (session) => {
      const expected = await this.getVersionAndIpfsHash({ dnpNameOrHash: name, version });
      const manifest = await super.getManifestFromDir(name, version);
      validateManifestSchema(manifest);
      const proof = await session.resolve(manifest.name, manifest.version);
      this.assertReleaseIdentity(manifest, expected.version, expected.contentUri, proof, name);
      return manifest;
    });
  }

  override async getPkgRelease(args: Parameters<DappnodeRepository["getPkgRelease"]>[0]): Promise<PackageRelease> {
    return this.withRegistry(async (session) => {
      const expected = await this.getVersionAndIpfsHash(args);
      const release = await super.getPkgRelease(args);
      const proof = await session.resolve(release.dnpName, release.semVersion);
      this.assertReleaseIdentity(release.manifest, expected.version, expected.contentUri, proof, args.dnpNameOrHash);
      release.registryVerification = proof;
      return release;
    });
  }

  override async getPkgsReleases(
    ...args: Parameters<DappnodeRepository["getPkgsReleases"]>
  ): Promise<PackageRelease[]> {
    return this.withRegistry(() => super.getPkgsReleases(...args));
  }

  private assertReleaseIdentity(
    manifest: Manifest,
    version: string,
    cid: string,
    proof: RegistryVerification,
    requestedName: string
  ): void {
    if (
      manifest.version !== version ||
      manifest.name !== proof.packageName ||
      (requestedName.endsWith(".dappnode.eth") && manifest.name !== requestedName) ||
      normalizeReleaseCid(cid) !== proof.cid
    ) {
      throw new Error("CHAIN VERIFICATION: release name, version or CID differs from the verified registry record");
    }
  }

  /** Recheck every chosen CID using a fresh finalized snapshot before Docker mutation. */
  async assertVerifiedReleases(releases: PackageRelease[]): Promise<void> {
    await this.withRegistry(async (session) => {
      for (const release of releases) {
        if (!release.registryVerification || !release.releaseCid)
          throw new Error("CHAIN VERIFICATION: unverified release");
        const proof = await session.resolve(release.dnpName, release.semVersion);
        this.assertReleaseIdentity(release.manifest, release.semVersion, release.releaseCid, proof, release.dnpName);
        if (normalizeReleaseCid(release.registryVerification.cid) !== proof.cid)
          throw new Error("CHAIN VERIFICATION: release CID changed");
      }
    });
  }

  private async updateProviders(): Promise<void> {
    const newIpfsUrl = getIpfsUrls();
    // super.changeEthProvider();
    super.changeIpfsGatewayUrl(newIpfsUrl);
  }

  /**
   * Resolve a small IPFS file using the currently selected gateway target.
   * Used by DAppManager's content-addressed avatar endpoint.
   */
  public async getIpfsFileBytes(hash: string, maxLength: number): Promise<Uint8Array> {
    await this.updateProviders();
    return super.writeFileToBytes(hash, maxLength, params.IPFS_TIMEOUT);
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
      version
    });

    // validate manifest and compose and notifications and setupwizard files
    this.validateSchemas(pkgRelease);

    // join metadata files in manifest
    pkgRelease.manifest = this.joinFilesInManifest({
      manifest: pkgRelease.manifest,
      disclaimer: pkgRelease.disclaimer,
      gettingStarted: pkgRelease.gettingStarted,
      grafanaDashboards: pkgRelease.grafanaDashboards,
      prometheusTargets: pkgRelease.prometheusTargets,
      notifications: pkgRelease.notifications,
      avatarFile: pkgRelease.avatarFile
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
  async getReleases(packages: { [name: string]: string }): Promise<PackageRelease[]> {
    await this.updateProviders();

    const pkgReleases = await this.getPkgsReleases(packages, db.releaseKeysTrusted.get(), process.arch);

    // validate manifest and compose and notifications and setupwizard files
    pkgReleases.forEach((pkgRelease) => {
      this.validateSchemas(pkgRelease);
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
        notifications: pkgRelease.notifications,
        avatarFile: pkgRelease.avatarFile
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
    return this.withRegistry(async () => {
      const result = await dappGet(this, req, options);
      const releases = await this.getReleases(result.state);
      return { ...result, releases };
    });
  }

  private joinFilesInManifest({
    manifest,
    SetupWizard,
    disclaimer,
    gettingStarted,
    prometheusTargets,
    grafanaDashboards,
    notifications,
    avatarFile
  }: {
    manifest: Manifest;
    SetupWizard?: SetupWizard;
    disclaimer?: string;
    gettingStarted?: string;
    prometheusTargets?: PrometheusTarget[];
    grafanaDashboards?: GrafanaDashboard[];
    notifications?: NotificationsConfig;
    avatarFile?: DistributedFile;
  }): Manifest {
    if (SetupWizard) manifest.setupWizard = SetupWizard;
    if (disclaimer) manifest.disclaimer = { message: disclaimer };
    if (gettingStarted) manifest.gettingStarted = gettingStarted;
    if (prometheusTargets) manifest.prometheusTargets = prometheusTargets;
    if (grafanaDashboards && grafanaDashboards.length > 0) manifest.grafanaDashboards = grafanaDashboards;
    if (notifications) manifest.notifications = notifications;
    if (avatarFile) manifest.avatarUrl = fileToGatewayUrl(avatarFile);

    return manifest;
  }

  /**
   * Validates manifest and compose and notifications and setupwizard schemas
   */
  private validateSchemas(pkgRelease: PackageRelease): void {
    validateManifestSchema(pkgRelease.manifest);
    validateDappnodeCompose(pkgRelease.compose, pkgRelease.manifest);
    if (pkgRelease.setupWizard) validateSetupWizardSchema(pkgRelease.setupWizard);
    if (pkgRelease.notifications) validateNotificationsSchema(pkgRelease.notifications);
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
    const customCompose = new ComposeEditor(setDappnodeComposeDefaults(compose, manifest), { dnpName: manifest.name });

    const services = Object.values(customCompose.services());
    const globalEnvsFromDbPrefixed = computeGlobalEnvsFromDb(true);
    const isCore = getIsCore(manifest);
    const metadata = this.parseMetadataFromManifest(manifest);
    for (const service of services) {
      service.setGlobalEnvs(manifest.globalEnvs, globalEnvsFromDbPrefixed, isCore);

      service.mergeLabels(
        writeMetadataToLabels({
          dnpName: manifest.name,
          version: manifest.version,
          serviceName: service.serviceName,
          dependencies: sanitizeDependencies(metadata.dependencies || {}),
          avatar: this.fileToMultiaddress(avatarFile),
          chain: metadata.chain,
          categories: metadata.categories,
          origin,
          isCore,
          isMain:
            // If developer chooses this service as main
            metadata.mainService === service.serviceName ||
            // Or if there is a single service
            services.length === 1
              ? true
              : undefined,
          dockerTimeout: parseTimeoutSeconds(metadata.dockerTimeout)
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

    if (distributedFile.source === "ipfs") return `/ipfs/${this.normalizeHash(distributedFile.hash)}`;
    if (distributedFile.source === "mirror") return fileToGatewayUrl(distributedFile); // full HTTP URL; resolveAvatarUrl handles it
    return "";
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
      ...omit(manifest as ManifestWithImage, ["avatar", "image", "setupSchema", "setupTarget", "setupUiJson"]),
      ...(setupWizard ? { setupWizard } : {}),
      // ##### Is this necessary? Correct manifest: type missing
      type: manifest.type || "service"
    };
  }
}
