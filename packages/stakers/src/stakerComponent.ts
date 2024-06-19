import {
  dockerComposeUpPackage,
  dockerContainerStop,
  dockerNetworkDisconnect,
  listPackage,
  listPackageNoThrow,
  listPackages,
} from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import {
  DappnodeInstaller,
  packageGetData,
  packageInstall,
} from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import {
  InstalledPackageDataApiReturn,
  InstalledPackageData,
  UserSettingsAllDnps,
  PackageContainer,
  StakerItem,
  ComposeServiceNetworksObj,
  ComposeService,
  ComposeNetworks,
} from "@dappnode/types";
import {
  getIsInstalled,
  getIsUpdated,
  getIsRunning,
  fileToGatewayUrl,
} from "@dappnode/utils";
import { lt } from "semver";
import { merge, uniq, isEqual } from "lodash-es";

export class StakerComponent {
  protected dappnodeInstaller: DappnodeInstaller;

  constructor(dappnodeInstaller: DappnodeInstaller) {
    this.dappnodeInstaller = dappnodeInstaller;
  }

  protected async getAll({
    dnpNames,
    currentClient,
    relays,
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
            isSelected: dnpName === currentClient || currentClient === true,
          };
        } catch (error) {
          return {
            status: "error",
            dnpName,
            error,
          };
        }
      })
    );
  }

  protected async persistSelectedIfInstalled(
    dnpName: string,
    dockerNetworkConfigsToAdd: {
      [serviceName: string]: ComposeServiceNetworksObj;
    },
    userSettings?: UserSettingsAllDnps
  ): Promise<void> {
    logs.info(`Persisting ${dnpName}`);
    await this.setStakerPkgConfig(
      dnpName,
      dockerNetworkConfigsToAdd,
      userSettings
    );
  }

  protected async setNew({
    newStakerDnpName,
    dockerNetworkName,
    compatibleClients,
    dockerNetworkConfigsToAdd,
    userSettings,
    prevClient,
  }: {
    newStakerDnpName: string | null | undefined;
    dockerNetworkName: string;
    compatibleClients:
      | {
          dnpName: string;
          minVersion: string;
        }[]
      | null;
    dockerNetworkConfigsToAdd: {
      [serviceName: string]: ComposeServiceNetworksObj;
    };
    userSettings?: UserSettingsAllDnps;
    prevClient?: string | null;
  }): Promise<void> {
    if (!prevClient && !newStakerDnpName) {
      logs.info("no client selected, skipping");
      return;
    }

    const currentPkg = await listPackageNoThrow({
      dnpName: prevClient || "",
    });

    if (currentPkg) {
      if (prevClient && compatibleClients)
        this.ensureCompatibilityRequirements(
          prevClient,
          compatibleClients,
          currentPkg.version
        );
      if (prevClient !== newStakerDnpName)
        await this.unsetStakerPkgConfig(currentPkg, dockerNetworkName);
    }

    if (!newStakerDnpName) return;
    // set staker config
    await this.setStakerPkgConfig(
      newStakerDnpName,
      dockerNetworkConfigsToAdd,
      userSettings
    );
  }

  /**
   * Set the staker pkg:
   * - ensures the staker pkg is installed
   * - connects the staker pkg to the staker network
   * - adds the staker network to the docker-compose file
   * - starts the staker pkg
   */
  private async setStakerPkgConfig(
    dnpName: string,
    dockerNetworkConfigsoAdd: {
      [serviceName: string]: ComposeServiceNetworksObj;
    },
    userSettings?: UserSettingsAllDnps
  ): Promise<void> {
    // ensure pkg installed
    if (
      !(await listPackageNoThrow({
        dnpName,
      }))
    )
      await packageInstall(this.dappnodeInstaller, {
        name: dnpName,
        userSettings,
      });
    else if (userSettings) {
      // write userSettings if are different. Currently only applies to mev boost
      const userSettingsPrev = new ComposeFileEditor(
        dnpName,
        false
      ).getUserSettings();
      if (!isEqual(userSettingsPrev, userSettings)) {
        const composeEditor = new ComposeFileEditor(dnpName, false);
        composeEditor.applyUserSettings(userSettings, { dnpName });
        composeEditor.write();
      }
    }

    const pkg = await listPackage({
      dnpName,
    });

    // add staker network to the compose file
    this.addStakerNetworkToCompose(pkg.dnpName, dockerNetworkConfigsoAdd);

    // start all containers
    await dockerComposeUpPackage({ dnpName: pkg.dnpName }, true);
  }

  /**
   * Adds the staker network and its fullnode alias to the docker-compose file
   */
  private addStakerNetworkToCompose(
    dnpName: string,
    netConfigsToAdd: { [serviceName: string]: ComposeServiceNetworksObj }
  ): void {
    const composeEditor = new ComposeFileEditor(dnpName, false);
    const services = composeEditor.compose.services;
    const rootNetworks = composeEditor.compose.networks || {};

    for (const [serviceName, networkConfig] of Object.entries(
      netConfigsToAdd
    )) {
      // Find the service that includes serviceName in its name
      const service = this.findMatchingService({ services, serviceName });

      if (!service) {
        logs.warn(`Service ${serviceName} not found in ${dnpName}, skipping`);
        continue; // TODO: Throw error here?
      }

      if (Array.isArray(service.networks)) {
        logs.warn(
          `Service ${serviceName} in ${dnpName} has a network declared in array format, skipping`
        );
        continue;
      }

      service.networks = this.mergeServiceNetworks({
        currentNetworks: service.networks,
        networksToAdd: networkConfig,
      });

      composeEditor.compose.networks = this.updateComposeRootNetworks({
        currentRootNetworks: rootNetworks,
        serviceNetworkConfig: netConfigsToAdd,
      });
    }

    composeEditor.write();
  }

  /**
   * Looks for the service that matches the serviceName
   *
   * If the service is not found, it will look for a service that includes the serviceName in its name
   */
  private findMatchingService({
    services,
    serviceName,
  }: {
    services: {
      [dnpName: string]: ComposeService;
    };
    serviceName: string;
  }): ComposeService {
    return (
      services[serviceName] ||
      Object.entries(services).find(([name]) => name.includes(serviceName))?.[1]
    );
  }

  /**
   * Merges the current networks with the networks to add in a docker compose service
   *
   * It also ensures that the aliases are unique
   */
  private mergeServiceNetworks({
    currentNetworks,
    networksToAdd,
  }: {
    currentNetworks?: ComposeServiceNetworksObj;
    networksToAdd: ComposeServiceNetworksObj;
  }): ComposeServiceNetworksObj {
    const mergedNetworks: ComposeServiceNetworksObj = { ...currentNetworks };

    merge(mergedNetworks, networksToAdd);

    for (const network of Object.values(mergedNetworks)) {
      if (network.aliases) network.aliases = uniq(network.aliases);
    }
    return mergedNetworks;
  }

  /**
   * Updates the root level networks in the docker compose file
   */
  private updateComposeRootNetworks({
    currentRootNetworks,
    serviceNetworkConfig,
  }: {
    currentRootNetworks: ComposeNetworks;
    serviceNetworkConfig: ComposeServiceNetworksObj;
  }): ComposeNetworks {
    const updatedRootNetworks = { ...currentRootNetworks };

    // Ensure all networks are added to the root level
    const serviceNetworkNames = Object.keys(serviceNetworkConfig);

    for (const networkName of serviceNetworkNames)
      if (!updatedRootNetworks[networkName])
        updatedRootNetworks[networkName] = { external: true };

    return updatedRootNetworks;
  }

  /**
   * Unset staker pkg:
   * - disconnects the staker pkg from the staker network
   * - stops the staker pkg
   * - removes the staker network from the docker-compose file
   */
  private async unsetStakerPkgConfig(
    pkg: InstalledPackageData,
    dockerNetworkName: string
  ): Promise<void> {
    // disconnect pkg from staker network
    await this.disconnectPkgFromStakerNetwork(
      dockerNetworkName,
      pkg.containers
    );

    // stop all containers
    await this.stopAllPkgContainers(pkg);
    // remove staker network from the compose file
    this.removeStakerNetworkFromCompose(pkg.dnpName, dockerNetworkName);
  }

  private async disconnectPkgFromStakerNetwork(
    networkName: string,
    pkgContainers: PackageContainer[]
  ): Promise<void> {
    const connectedContainers = pkgContainers
      .filter((container) =>
        container.networks.some((network) => network.name === networkName)
      )
      .map((container) => container.containerName);
    for (const container of connectedContainers)
      await dockerNetworkDisconnect(networkName, container);
  }

  private removeStakerNetworkFromCompose(
    dnpName: string,
    dockerNetworkName: string
  ): void {
    const composeEditor = new ComposeFileEditor(dnpName, false);
    const services = composeEditor.compose.services;

    // Remove network from root level
    delete composeEditor.compose.networks?.[dockerNetworkName];

    for (const [, service] of Object.entries(services)) {
      const serviceNetworks = service.networks;

      if (!serviceNetworks) continue;

      // Array case
      if (Array.isArray(serviceNetworks))
        service.networks = serviceNetworks.filter(
          (network) => network !== dockerNetworkName
        );
      // ComposeServiceNetworksObj case
      else delete serviceNetworks[dockerNetworkName];
    }

    composeEditor.write();
  }

  private ensureCompatibilityRequirements(
    dnpName: string,
    compatibleClients: {
      dnpName: string;
      minVersion: string;
    }[],
    pkgVersion: string
  ): void {
    if (!dnpName) return;

    const compatibleClient = compatibleClients.find(
      (c) => c.dnpName === dnpName
    );

    // ensure valid dnpName
    if (!compatibleClient)
      throw Error(
        "The selected staker is not compatible with the current network"
      );

    // ensure valid version
    if (
      compatibleClient?.minVersion &&
      lt(pkgVersion, compatibleClient.minVersion)
    ) {
      throw Error(
        `The selected staker version from ${dnpName} is not compatible with the current network. Required version: ${compatibleClient.minVersion}. Got: ${pkgVersion}`
      );
    }
  }

  /**
   * Stop all the containers from a given package dnpName
   */
  // TODO: Move this to where packages and containers are started/stopped
  private async stopAllPkgContainers(
    pkg: InstalledPackageDataApiReturn | InstalledPackageData
  ): Promise<void> {
    await Promise.all(
      pkg.containers
        .filter((c) => c.running)
        .map(async (c) =>
          dockerContainerStop(c.containerName, { timeout: c.dockerTimeout })
        )
    ).catch((e) => logs.error(e.message));
  }
}
