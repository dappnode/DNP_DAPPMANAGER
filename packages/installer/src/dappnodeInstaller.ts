import { params } from "@dappnode/params";
import { DappnodeRepository, PkgRelease } from "@dappnode/toolkit";
import * as db from "@dappnode/db";
import {
  Compose,
  DappGetState,
  DistributedFile,
  Eth2ClientTarget,
  EthClientRemote,
  EthClientStatusError,
  EthProviderError,
  GrafanaDashboard,
  IpfsClientTarget,
  Manifest,
  PackageRequest,
  SetupWizard,
  PrometheusTarget,
} from "@dappnode/common";
import { getMultiClientStatus } from "./ethClient/clientStatus";
import { emitSyncedNotification } from "./ethClient/syncedNotification";
import { DappgetOptions, dappGet } from "./dappGet/index.js";
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
import { parseMetadataFromManifest } from "@dappnode/manifest";

/**
 * Computes the current eth2ClientTarget based on:
 * - remote
 * - executionClient
 * - consensusClient
 */
function computeEthereumTarget(): Eth2ClientTarget {
  const executionClient = db.executionClientMainnet.get();
  const consensusClient = db.consensusClientMainnet.get();
  const remote = db.ethClientRemote.get();
  switch (remote) {
    case null:
    case EthClientRemote.on:
      return "remote";

    case EthClientRemote.off:
      if (!executionClient || !consensusClient) return "remote";

      return {
        execClient: executionClient,
        consClient: consensusClient,
      };
  }
}

/**
 * Parse client status errors to a single string line
 *
 * Note: MUST NOT have undefined as a valid return type so typescript
 *       enforces that all possible states are covered
 */
function parseClientStatusError(statusError: EthClientStatusError): string {
  switch (statusError.code) {
    case "UNKNOWN_ERROR":
      return `Unknown error: ${statusError.error.message}`;

    case "STATE_NOT_SYNCED":
      return "State is not synced";

    case "STATE_CALL_ERROR":
      return `State call error: ${statusError.error.message}`;

    case "IS_SYNCING":
      return "Is syncing";

    case "NOT_AVAILABLE":
      return `Not available: ${statusError.error.message}`;

    case "NOT_RUNNING":
      return "Not running";

    case "NOT_INSTALLED":
      return "Not installed";

    case "INSTALLING":
      return "Is installing";

    case "INSTALLING_ERROR":
      return `Install error: ${statusError.error.message}`;

    case "UNINSTALLED":
      return `Package is uninstalled`;
  }
}

/**
 * Returns the url of the JSON RPC an Eth multi-client status and target
 * If the package target is not active it returns the remote URLs
 * @returns ethProvier http://geth.dappnode:8545
 */
async function getEthUrl(): Promise<string> {
  if (params.ETH_MAINNET_RPC_URL_OVERRIDE)
    return params.ETH_MAINNET_RPC_URL_OVERRIDE;

  const target = computeEthereumTarget();
  const fallback = db.ethClientFallback.get();

  // Initial case where the user has not selected any client yet
  if (!target) throw new EthProviderError(`No ethereum client selected yet`);

  // Remote is selected, just return remote
  if (target === "remote") return params.ETH_MAINNET_RPC_URL_REMOTE;

  // Full node is selected, ensure client is not empty
  if (!target.execClient) throw Error("No execution client selected yet");
  if (!target.consClient) throw Error("No consensus client selected yet");

  const status = await getMultiClientStatus(
    target.execClient,
    target.consClient
  );
  db.ethExecClientStatus.set(target.execClient, status);
  emitSyncedNotification(target, status);

  if (status.ok) {
    // Package test succeeded return its url
    return status.url;
  } else {
    if (fallback === "on") {
      // Fallback on, ignore error and return remote
      return params.ETH_MAINNET_RPC_URL_REMOTE;
    } else {
      // Fallback off, throw nice error
      const message = parseClientStatusError(status);
      throw new EthProviderError(`Node not available: ${message}`);
    }
  }
}

/**
 * Returns the ipfsUrl to initialize the ipfs instance
 */
function getIpfsUrl(): string {
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
  constructor(ipfsUrl: string, ethUrl: string, timeout?: number) {
    super(ipfsUrl, ethUrl, timeout);
  }

  private async updateProviders(): Promise<void> {
    const newEthUrl = await getEthUrl();
    const newIpfsUrl = getIpfsUrl();
    super.changeEthProvider(newEthUrl);
    super.changeIpfsProvider(newIpfsUrl);
  }

  /**
   * Get release assets for a request
   */
  async getRelease(name: string, version?: string): Promise<PkgRelease> {
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
      pkgRelease.avatarFile
    );

    return pkgRelease;
  }

  /**
   * Get multiple release assets for multiple requests
   */
  async getReleases(packages: {
    [name: string]: string;
  }): Promise<PkgRelease[]> {
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
        pkgRelease.avatarFile
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
    releases: PkgRelease[];
    message: string;
    state: DappGetState;
    alreadyUpdated: DappGetState;
    currentVersions: DappGetState;
  }> {
    const result = await dappGet(req, options);
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
  private validateManifestAndComposeSchemas(pkgRelease: PkgRelease): void {
    validateManifestSchema(pkgRelease.manifest);
    validateDappnodeCompose(pkgRelease.compose, pkgRelease.manifest);
  }

  /**
   * Adds custom labels to the compose
   */
  private addCustomDefaultsAndLabels(
    compose: Compose,
    manifest: Manifest,
    avatarFile: DistributedFile | undefined
  ): Compose {
    const customCompose = new ComposeEditor(
      setDappnodeComposeDefaults(compose, manifest)
    );

    const services = Object.values(customCompose.services());
    const globalEnvsFromDbPrefixed = computeGlobalEnvsFromDb(true);
    const isCore = getIsCore(manifest);
    const metadata = parseMetadataFromManifest(manifest);
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
}
