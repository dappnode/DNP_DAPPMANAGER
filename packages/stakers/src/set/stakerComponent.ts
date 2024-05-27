import {
  dockerComposeUpPackage,
  dockerContainerStop,
  dockerNetworkConnect,
  dockerNetworkDisconnect,
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
} from "@dappnode/types";
import { lt } from "semver";

export class StakerComponent {
  protected dnpName: string | null;
  protected dappnodeInstaller: DappnodeInstaller;
  protected stakerNetwork = params.DOCKER_STAKER_NETWORK_NAME;

  constructor(dnName: string | null, dappnodeInstaller: DappnodeInstaller) {
    this.dnpName = dnName;
    this.dappnodeInstaller = dappnodeInstaller;
  }

  protected async setNew({
    newStakerDnpName,
    compatibleClients,
    belongsToStakerNetwork,
    executionFullnodeAlias,
    userSettings,
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
  }): Promise<void> {
    if (!this.dnpName && !newStakerDnpName) return;
    if (this.dnpName === newStakerDnpName) return; // TODO: test if this return can cause issues due to not ensuring: pkg installed, running anbd connected to the network

    const pkg = await listPackageNoThrow({
      dnpName: this.dnpName || "",
    });

    if (pkg && compatibleClients)
      this.ensureSetRequirements(compatibleClients, pkg?.version || "0.0.0");

    if (newStakerDnpName) {
      if (pkg) {
        // ensure old pkg is not running
        await this.stopAllPkgContainers(pkg);
        if (belongsToStakerNetwork) {
          // disconnect old pkg from staker network
          // important: disconnecting the container is necessary to avoid relying on docker-compose calls instead of docker calls
          await this.disconnectConnectedPkgFromStakerNetwork(
            this.stakerNetwork,
            pkg.containers
          );
          // remove staker network from the compose file
          this.removeStakerNetworkFromCompose(pkg.dnpName);
        }
      }
      // ensure pkg installed and running
      const newPkg = await listPackageNoThrow({
        dnpName: newStakerDnpName,
      });
      if (!newPkg)
        await packageInstall(this.dappnodeInstaller, {
          name: newStakerDnpName,
          userSettings,
        });
      else
        await dockerComposeUpPackage(
          { dnpName: newStakerDnpName },
          {},
          {},
          true
        );

      if (belongsToStakerNetwork) {
        // ensure new pkg is connected to the staker network
        await this.connectPkgToStakerNetwork(
          newPkg?.containers || [],
          executionFullnodeAlias
        );
        // add staker network to the compose file
        this.addStakerNetworkToCompose(
          newStakerDnpName,
          executionFullnodeAlias
        );
      }
    } else {
      if (!pkg) return;
      // Stop the current staker
      await this.stopAllPkgContainers(pkg);
    }
  }

  /**
   * Connects the staker pkg to the staker network with the fullnode alias
   */
  private async connectPkgToStakerNetwork(
    pkgContainers: PackageContainer[],
    alias?: string | null
  ): Promise<void> {
    const disconnectedContainers = pkgContainers
      .filter(
        (container) =>
          !container.networks.some(
            (network) => network.name === this.stakerNetwork
          )
      )
      .map((container) => container.containerName);
    for (const container of disconnectedContainers)
      await dockerNetworkConnect(this.stakerNetwork, container, {
        Aliases: alias ? [alias] : [],
      });
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
    compatibleClients: {
      dnpName: string;
      minVersion: string;
    }[],
    pkgVersion: string
  ): void {
    if (!this.dnpName) return;

    const compatibleClient = compatibleClients.find(
      (c) => c.dnpName === this.dnpName
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
