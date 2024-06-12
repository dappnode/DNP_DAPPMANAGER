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
} from "@dappnode/types";
import {
  getIsInstalled,
  getIsUpdated,
  getIsRunning,
  fileToGatewayUrl,
} from "@dappnode/utils";
import { lt } from "semver";

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
    dockerNetSvcAliasesMap: Record<string, { regex: RegExp; alias: string }[]>,
    userSettings?: UserSettingsAllDnps
  ): Promise<void> {
    console.log("persisting: ", dnpName);
    await this.setStakerPkgConfig(
      dnpName,
      dockerNetSvcAliasesMap,
      userSettings
    );
  }

  protected async setNew({
    newStakerDnpName,
    dockerNetworkName,
    compatibleClients,
    dockerNetSvcAliasesMap,
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
    dockerNetSvcAliasesMap: Record<string, { regex: RegExp; alias: string }[]>;
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
      dockerNetSvcAliasesMap,
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
    dockerNetSvcAliasesMap: Record<string, { regex: RegExp; alias: string }[]>,
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
    this.addStakerNetworkToCompose(pkg.dnpName, dockerNetSvcAliasesMap);

    // start all containers
    //if (!pkg.containers.some((c) => c.running))
    await dockerComposeUpPackage({ dnpName: pkg.dnpName }, true);
  }

  /**
   * Adds the staker network and its fullnode alias to the docker-compose file
   */
  private addStakerNetworkToCompose(
    dnpName: string,
    dockerNetSvcAliasesMap: Record<string, { regex: RegExp; alias: string }[]>
  ): void {
    const compose = new ComposeFileEditor(dnpName, false);

    for (const [dockerNetworkName, serviceRegexAliases] of Object.entries(
      dockerNetSvcAliasesMap
    )) {
      // add to compose network
      const stakerNetwork = compose.compose.networks?.[dockerNetworkName];
      if (!stakerNetwork) {
        compose.compose.networks = {
          ...compose.compose.networks,
          [dockerNetworkName]: {
            external: true,
          },
        };
        compose.write();
      }

      // add to compose service network
      for (const [serviceName, service] of Object.entries(
        compose.compose.services
      )) {
        const composeService = new ComposeFileEditor(dnpName, false);

        // network declared in array format is not supported
        if (Array.isArray(service.networks)) {
          logs.warn(
            `Service ${serviceName} in ${dnpName} has a network declared in array format, skipping`
          );
          continue;
        }

        const stakerServiceNetwork = service.networks?.[dockerNetworkName];
        const aliases = serviceRegexAliases
          .filter(({ regex }) => regex.test(serviceName))
          .map(({ alias }) => alias);

        if (aliases.length === 0) {
          aliases.push(`${serviceName}.${dockerNetworkName}.dappnode`);
        }

        if (!stakerServiceNetwork) {
          composeService
            .services()
            // eslint-disable-next-line no-unexpected-multiline
            [serviceName].addNetwork(dockerNetworkName, {
              aliases: aliases,
            });
          composeService.write();
        } else {
          // check the aliases are included in the existing service network aliases if not add them
          const existingAliases = stakerServiceNetwork.aliases || [];
          const newAliases = aliases.filter(
            (alias) => !existingAliases.includes(alias)
          );
          if (newAliases.length > 0) {
            composeService
              .services()
              // eslint-disable-next-line no-unexpected-multiline
              [serviceName].addNetwork(dockerNetworkName, {
                aliases: existingAliases.concat(newAliases),
              });
            composeService.write();
          }
        }
      }
    }
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
    // remove from compose network
    const compose = new ComposeFileEditor(dnpName, false);
    delete compose.compose.networks?.[dockerNetworkName];
    compose.write();
    // remove from compose service network
    for (const [serviceName, service] of Object.entries(
      compose.compose.services
    )) {
      const composeService = new ComposeFileEditor(dnpName, false);
      // network declared in array format is not supported
      if (Array.isArray(service.networks)) {
        logs.warn(
          `Service ${serviceName} in ${dnpName} has a network declared in array format, skipping`
        );
        continue;
      }
      composeService
        .services()
        // eslint-disable-next-line no-unexpected-multiline
        [serviceName].removeNetwork(dockerNetworkName);
      composeService.write();
    }
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
