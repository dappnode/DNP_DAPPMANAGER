import {
  dockerComposeUpPackage,
  dockerContainerStop,
  dockerNetworkDisconnect,
  listPackage,
  listPackageNoThrow,
} from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { DappnodeInstaller, packageInstall } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import {
  InstalledPackageDataApiReturn,
  InstalledPackageData,
  UserSettingsAllDnps,
  PackageContainer,
  Network,
} from "@dappnode/types";
import { lt } from "semver";

export class StakerComponent {
  protected network: Network;
  protected dappnodeInstaller: DappnodeInstaller;
  protected stakerNetwork = params.DOCKER_STAKER_NETWORK_NAME;

  constructor(network: Network, dappnodeInstaller: DappnodeInstaller) {
    this.network = network;
    this.dappnodeInstaller = dappnodeInstaller;
  }

  protected async setNew({
    newStakerDnpName,
    compatibleClients,
    belongsToStakerNetwork,
    executionFullnodeAlias,
    userSettings,
    prevClient,
  }: {
    newStakerDnpName: string | null | undefined;
    compatibleClients:
      | {
          dnpName: string;
          minVersion: string;
        }[]
      | null;
    belongsToStakerNetwork: boolean;
    executionFullnodeAlias?: string;
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
      if (newStakerDnpName && compatibleClients)
        this.ensureSetRequirements(
          newStakerDnpName,
          compatibleClients,
          currentPkg.version
        );
      await this.unsetStakerPkgConfig(currentPkg, belongsToStakerNetwork);
    }

    if (!newStakerDnpName) return;
    // set staker config
    await this.setStakerPkgConfig(
      newStakerDnpName,
      belongsToStakerNetwork,
      userSettings,
      executionFullnodeAlias
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
    belongsToStakerNetwork: boolean,
    userSettings?: UserSettingsAllDnps,
    executionFullnodeAlias?: string | null
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
    if (belongsToStakerNetwork)
      this.addStakerNetworkToCompose(pkg.dnpName, executionFullnodeAlias);

    // start all containers
    // docker will automatically recreate those with changes in the compose file
    await dockerComposeUpPackage({ dnpName: pkg.dnpName }, {}, {}, true);
  }

  /**
   * Adds the staker network and its fullnode alias to the docker-compose file
   */
  private addStakerNetworkToCompose(
    dnpName: string,
    alias?: string | null
  ): void {
    // add to compose network
    const compose = new ComposeFileEditor(dnpName, false);
    const stakerNetwork = compose.compose.networks?.[this.stakerNetwork];
    if (!stakerNetwork) {
      compose.compose.networks = {
        ...compose.compose.networks,
        [this.stakerNetwork]: {
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
      const stakerServiceNetwork = service.networks?.[this.stakerNetwork];

      if (!stakerServiceNetwork) {
        composeService
          .services()
          // eslint-disable-next-line no-unexpected-multiline
          [serviceName].addNetwork(this.stakerNetwork, {
            aliases: alias ? [alias] : [],
          });
        composeService.write();
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
    belongsToStakerNetwork: boolean
  ): Promise<void> {
    // disconnect pkg from staker network
    if (belongsToStakerNetwork)
      await this.disconnectConnectedPkgFromStakerNetwork(
        this.stakerNetwork,
        pkg.containers
      );

    // stop all containers
    await this.stopAllPkgContainers(pkg);
    // remove staker network from the compose file
    if (belongsToStakerNetwork)
      this.removeStakerNetworkFromCompose(pkg.dnpName);
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

  private removeStakerNetworkFromCompose(dnpName: string): void {
    // remove from compose network
    const compose = new ComposeFileEditor(dnpName, false);
    delete compose.compose.networks?.[this.stakerNetwork];
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
        [serviceName].removeNetwork(this.stakerNetwork);
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
        `The selected staker version is not compatible with the current network. Required version: ${compatibleClient.minVersion}`
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
