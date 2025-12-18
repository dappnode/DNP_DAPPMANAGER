import { dockerComposeUpPackage, listPackageNoThrow, listPackages } from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { DappnodeInstaller, packageGetData, packageInstall } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import { InstalledPackageData, StakerItem, UserSettings, Network } from "@dappnode/types";
import { getIsInstalled, getIsUpdated, getIsRunning, fileToGatewayUrl } from "@dappnode/utils";
import { lt } from "semver";
import { params } from "@dappnode/params";

/**
 * Compatible client definition used for version validation
 */
export interface CompatibleClient {
  dnpName: string;
  minVersion: string;
}

/**
 * BlockchainComponent is the base class for all blockchain-related package management.
 * It provides generic infrastructure for:
 * - Installing and configuring packages
 * - Managing Docker network connections
 * - Package lifecycle (start, stop, recreate)
 * - Version compatibility checks
 *
 * This class is network-agnostic and can be extended for:
 * - L1 staking components (Consensus, Execution, MevBoost, Signer)
 * - L2 components (Starknet, etc.)
 * - Any other blockchain packages that need network connectivity
 */
export class BlockchainComponent {
  protected dappnodeInstaller: DappnodeInstaller;

  constructor(dappnodeInstaller: DappnodeInstaller) {
    this.dappnodeInstaller = dappnodeInstaller;
  }

  /**
   * Get all available packages for a list of DNP names
   * Returns status information for each package (installed, running, etc.)
   */
  protected async getAll({
    dnpNames,
    currentClient,
    relays
  }: {
    dnpNames: string[];
    currentClient?: boolean | string | null;
    relays?: string[];
  }): Promise<StakerItem[]> {
    const dnpList = await listPackages();

    return await Promise.all(
      dnpNames.map(async (dnpName) => {
        try {
          await this.dappnodeInstaller.getRepoContract(dnpName);
          const pkgData = await packageGetData(this.dappnodeInstaller, dnpName);
          return {
            status: "ok",
            dnpName,
            avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
            isInstalled: getIsInstalled(pkgData, dnpList),
            isUpdated: getIsUpdated(pkgData, dnpList),
            isRunning: getIsRunning(pkgData, dnpList),
            data: pkgData,
            relays, // only for mevBoost
            isSelected: dnpName === currentClient || currentClient === true
          };
        } catch (error) {
          return {
            status: "error",
            dnpName,
            error
          };
        }
      })
    );
  }

  /**
   * Set a new blockchain package, handling the transition from previous to new client
   * - Validates compatibility requirements
   * - Disconnects previous client from network
   * - Configures and starts new client
   */
  protected async setNew({
    newClientDnpName,
    dockerNetworkName,
    fullnodeAliases,
    compatibleClients,
    userSettings,
    prevClient
  }: {
    newClientDnpName: string | null | undefined;
    dockerNetworkName: string;
    fullnodeAliases: string[];
    compatibleClients: CompatibleClient[] | null;
    userSettings: UserSettings;
    prevClient?: string | null;
  }): Promise<void> {
    if (!prevClient && !newClientDnpName) {
      logs.info("no client selected, skipping");
      return;
    }

    const currentPkg = await listPackageNoThrow({
      dnpName: prevClient || ""
    });

    if (currentPkg) {
      if (prevClient && compatibleClients)
        this.ensureCompatibilityRequirements(prevClient, compatibleClients, currentPkg.version);
      if (prevClient !== newClientDnpName)
        await this.unsetPkgConfig({ pkg: currentPkg, dockerNetworkName, fullnodeAliases });
    }

    if (!newClientDnpName) return;
    // set package config
    await this.setPkgConfig({
      dnpName: newClientDnpName,
      isInstalled: Boolean(await listPackageNoThrow({ dnpName: newClientDnpName })),
      userSettings
    });
  }

  /**
   * Check if a package is installed
   */
  protected async isPackageInstalled(dnpName: string): Promise<boolean> {
    const dnp = await listPackageNoThrow({ dnpName });
    return Boolean(dnp);
  }

  /**
   * Get the Docker network name for a given network
   */
  protected getDockerNetworkName(network: Network): string {
    return params.DOCKER_BLOCKCHAIN_NETWORKS[network];
  }

  /**
   * Build the root networks configuration for docker-compose
   * Includes the blockchain-specific network and the private DAppNode network
   */
  protected getComposeRootNetworks(network: Network): NonNullable<UserSettings["networks"]>["rootNetworks"] {
    return {
      [this.getDockerNetworkName(network)]: {
        external: true
      },
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        external: true
      }
    };
  }

  /**
   * Configure and start a blockchain package
   * - If already installed: applies user settings and starts containers
   * - If not installed: installs the package with user settings
   */
  protected async setPkgConfig({
    dnpName,
    isInstalled,
    userSettings
  }: {
    dnpName: string;
    isInstalled: boolean;
    userSettings: UserSettings;
  }): Promise<void> {
    if (isInstalled) {
      await this.setInstalledPkgConfig({ dnpName, userSettings });
    } else {
      await packageInstall(this.dappnodeInstaller, {
        name: dnpName,
        userSettings: userSettings ? { [dnpName]: userSettings } : {}
      });
    }
  }

  /**
   * Apply settings to an already installed package and start it
   */
  private async setInstalledPkgConfig({
    dnpName,
    userSettings
  }: {
    dnpName: string;
    userSettings: UserSettings;
  }): Promise<void> {
    if (userSettings) {
      const composeEditor = new ComposeFileEditor(dnpName, false);

      composeEditor.applyUserSettings(userSettings, { dnpName });
      // it must be called write after applying user settings otherwise the new settings will be lost and therefore the compose up will not have effect
      composeEditor.write();
    }

    // start all containers
    await dockerComposeUpPackage({
      composeArgs: { dnpName },
      upAll: true
    });
  }

  /**
   * Disconnect and stop a blockchain package
   * - Removes package from Docker network
   * - Removes network aliases
   * - Recreates containers in stopped state
   */
  protected async unsetPkgConfig({
    pkg,
    dockerNetworkName,
    fullnodeAliases
  }: {
    pkg: InstalledPackageData;
    dockerNetworkName: string;
    fullnodeAliases: string[];
  }): Promise<void> {
    this.removeNetworkFromCompose(pkg.dnpName, dockerNetworkName);
    this.removeAliasesFromPrivateNetwork(pkg.dnpName, fullnodeAliases);

    // This recreates the package containers so that they include the recently added configuration
    // The flag --no-start is added so that the containers remain stopped after recreation
    await dockerComposeUpPackage({
      composeArgs: { dnpName: pkg.dnpName },
      upAll: false,
      dockerComposeUpOptions: { forceRecreate: true, noStart: true }
    });
  }

  /**
   * Remove specific aliases from the private DAppNode network in docker-compose
   */
  private removeAliasesFromPrivateNetwork(dnpName: string, aliasesToRemove: string[]): void {
    const composeEditor = new ComposeFileEditor(dnpName, false);
    const services = composeEditor.compose.services;

    for (const [, service] of Object.entries(services)) {
      const serviceNetworks = service.networks;

      if (!serviceNetworks || Array.isArray(serviceNetworks)) continue;

      for (const [networkName, networkSettings] of Object.entries(serviceNetworks)) {
        if (networkName === params.DOCKER_PRIVATE_NETWORK_NAME) {
          const aliases = networkSettings.aliases;
          if (aliases) networkSettings.aliases = aliases.filter((alias) => !aliasesToRemove.includes(alias));
        }
      }
    }

    composeEditor.write();
  }

  /**
   * Remove a network from the docker-compose file (both root level and service level)
   */
  private removeNetworkFromCompose(dnpName: string, dockerNetworkName: string): void {
    const composeEditor = new ComposeFileEditor(dnpName, false);
    const services = composeEditor.compose.services;

    // Remove network from root level
    delete composeEditor.compose.networks?.[dockerNetworkName];

    for (const [, service] of Object.entries(services)) {
      const serviceNetworks = service.networks;

      if (!serviceNetworks) continue;

      // Array case
      if (Array.isArray(serviceNetworks))
        service.networks = serviceNetworks.filter((network) => network !== dockerNetworkName);
      // ComposeServiceNetworksObj case
      else delete serviceNetworks[dockerNetworkName];
    }

    composeEditor.write();
  }

  /**
   * Validate that a package meets compatibility requirements
   * Throws if the package version is below the minimum required
   */
  protected ensureCompatibilityRequirements(
    dnpName: string,
    compatibleClients: CompatibleClient[],
    pkgVersion: string
  ): void {
    if (!dnpName) return;

    const compatibleClient = compatibleClients.find((c) => c.dnpName === dnpName);

    // ensure valid dnpName
    if (!compatibleClient) throw Error("The selected client is not compatible with the current network");

    // ensure valid version
    if (compatibleClient?.minVersion && lt(pkgVersion, compatibleClient.minVersion)) {
      throw Error(
        `The selected client version from ${dnpName} is not compatible with the current network. Required version: ${compatibleClient.minVersion}. Got: ${pkgVersion}`
      );
    }
  }
}
