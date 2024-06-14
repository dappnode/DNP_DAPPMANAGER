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
} from "@dappnode/types";
import {
  getIsInstalled,
  getIsUpdated,
  getIsRunning,
  fileToGatewayUrl,
} from "@dappnode/utils";
import { lt } from "semver";
import { merge } from "lodash-es";

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
    console.log("persisting: ", dnpName);
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
        this.ensureSetRequirements(
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

    const pkg = await listPackage({
      dnpName,
    });

    // add staker network to the compose file
    this.addStakerNetworkToCompose(pkg.dnpName, dockerNetworkConfigsoAdd);

    // start all containers
    //if (!pkg.containers.some((c) => c.running))
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
      const service =
        services[serviceName] ||
        Object.entries(services).find(([name]) =>
          name.includes(serviceName)
        )?.[1];

      if (!service) {
        logs.info(`Service ${serviceName} not found in ${dnpName}, skipping`);
        continue;
      }

      if (Array.isArray(service.networks)) {
        logs.warn(
          `Service ${serviceName} in ${dnpName} has a network declared in array format, skipping`
        );
        continue;
      }

      // Merge networkConfig into service.networks without removing existing aliases
      service.networks = service.networks || {};
      merge(service.networks, networkConfig);

      // Ensure all networks are added to the root level
      const serviceNetworkNames = Object.keys(networkConfig);

      for (const networkName of serviceNetworkNames)
        if (!rootNetworks[networkName])
          rootNetworks[networkName] = {
            external: true,
          };
    }

    composeEditor.compose.networks = rootNetworks;

    composeEditor.write();
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
    await this.disconnectConnectedPkgFromStakerNetwork(
      dockerNetworkName,
      pkg.containers
    );

    // stop all containers
    await this.stopAllPkgContainers(pkg);
    // remove staker network from the compose file
    this.removeStakerNetworkFromCompose(pkg.dnpName, dockerNetworkName);
  }

  private async disconnectConnectedPkgFromStakerNetwork(
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

  private ensureSetRequirements(
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
