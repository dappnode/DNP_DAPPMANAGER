import { params } from "@dappnode/params";
import { DappnodeRepository } from "@dappnode/toolkit";
import * as db from "@dappnode/db";
import {
  DappGetState,
  DirectoryFiles,
  Eth2ClientTarget,
  EthClientRemote,
  EthClientStatusError,
  EthProviderError,
  IpfsClientTarget,
  Manifest,
  PackageRelease,
  PackageRequest,
} from "@dappnode/common";
import { getMultiClientStatus } from "./ethClient/clientStatus";
import { emitSyncedNotification } from "./ethClient/syncedNotification";
import { DappgetOptions, dappGet } from "./dappGet/index.js";
import {
  validateDappnodeCompose,
  validateManifestSchema,
} from "@dappnode/schemas";

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

  private joinFilesInManifest(files: DirectoryFiles): Manifest {
    const manifest = files.manifest;

    if (files.setupWizard) manifest.setupWizard = files.setupWizard;
    if (files.disclaimer) manifest.disclaimer = { message: files.disclaimer };
    if (files.gettingStarted) manifest.gettingStarted = files.gettingStarted;
    if (files.prometheusTargets)
      manifest.prometheusTargets = files.prometheusTargets;
    if (files.grafanaDashboards && files.grafanaDashboards.length > 0)
      manifest.grafanaDashboards = files.grafanaDashboards;

    return manifest;
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
    await this.updateProviders();

    const os = process.arch;

    const result = await dappGet(req, options);

    // join all files in manifest
    const pkgsReleases = (await this.getPkgsReleases(result.state, os)).map(
      (pkgRelease) => {
        return {
          ...pkgRelease,
          manifest: this.joinFilesInManifest(pkgRelease),
        };
      }
    );

    // validate manifests and composes schemas
    pkgsReleases.forEach((pkgRelease) => {
      validateManifestSchema(pkgRelease.manifest);
      validateDappnodeCompose(pkgRelease.compose, pkgRelease.manifest);
    });

    // get release signature status
    // Verify release signature if available
    const trustedKeys = db.releaseKeysTrusted.get();
    // add release signature status to each release
    pkgsReleases.forEach((pkgRelease) => {

  }
}
