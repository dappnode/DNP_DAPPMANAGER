import { dockerComposeUpPackage, listPackageNoThrow, listPackages } from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { DappnodeInstaller, packageInstall } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import { InstalledPackageData, StakerItem, UserSettings, Network } from "@dappnode/types";
//import { getIsInstalled, getIsUpdated, getIsRunning, fileToGatewayUrl } from "@dappnode/utils";
import { lt } from "semver";
import { params } from "@dappnode/params";

export class StakerComponent {
  protected dappnodeInstaller: DappnodeInstaller;

  constructor(dappnodeInstaller: DappnodeInstaller) {
    this.dappnodeInstaller = dappnodeInstaller;
  }

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

    // TODO: remove this code, it only allows to test not using published packages
    return dnpList
      .filter((dnp) => dnpNames.includes(dnp.dnpName))
      .map((dnp) => {
        return {
          status: "ok",
          dnpName: dnp.dnpName,
          avatarUrl: dnp.avatarUrl,
          isInstalled: true,
          isUpdated: true,
          isRunning: dnp.containers.every((c) => c.running),
          relays, // only for mevBoost
          isSelected: dnp.dnpName === currentClient || currentClient === true
        };
      });

    // return await Promise.all(
    //   dnpNames.map(async (dnpName) => {
    //     try {
    //       await this.dappnodeInstaller.getRepoContract(dnpName);
    //       const pkgData = await packageGetData(this.dappnodeInstaller, dnpName);
    //       return {
    //         status: "ok",
    //         dnpName,
    //         avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
    //         isInstalled: getIsInstalled(pkgData, dnpList),
    //         isUpdated: getIsUpdated(pkgData, dnpList),
    //         isRunning: getIsRunning(pkgData, dnpList),
    //         data: pkgData,
    //         relays, // only for mevBoost
    //         isSelected: dnpName === currentClient || currentClient === true
    //       };
    //     } catch (error) {
    //       return {
    //         status: "error",
    //         dnpName,
    //         error
    //       };
    //     }
    //   })
    // );
  }

  protected async setNew({
    newStakerDnpName,
    dockerNetworkName,
    fullnodeAliases,
    compatibleClients,
    userSettings,
    prevClient
  }: {
    newStakerDnpName: string | null | undefined;
    dockerNetworkName: string;
    fullnodeAliases: string[];
    compatibleClients:
      | {
          dnpName: string;
          minVersion: string;
        }[]
      | null;
    userSettings: UserSettings;
    prevClient?: string | null;
  }): Promise<void> {
    if (!prevClient && !newStakerDnpName) {
      logs.info("no client selected, skipping");
      return;
    }

    const currentPkg = await listPackageNoThrow({
      dnpName: prevClient || ""
    });

    if (currentPkg) {
      if (prevClient && compatibleClients)
        this.ensureCompatibilityRequirements(prevClient, compatibleClients, currentPkg.version);
      if (prevClient !== newStakerDnpName)
        await this.unsetStakerPkgConfig({ pkg: currentPkg, dockerNetworkName, fullnodeAliases });
    }

    if (!newStakerDnpName) return;
    // set staker config
    await this.setStakerPkgConfig({
      dnpName: newStakerDnpName,
      isInstalled: Boolean(await listPackageNoThrow({ dnpName: newStakerDnpName })),
      userSettings
    });
  }

  protected async isPackageInstalled(dnpName: string): Promise<boolean> {
    const dnp = await listPackageNoThrow({ dnpName });

    return Boolean(dnp);
  }

  protected getComposeRootNetworks(network: Network): NonNullable<UserSettings["networks"]>["rootNetworks"] {
    return {
      [params.DOCKER_STAKER_NETWORKS[network]]: {
        external: true
      },
      [params.DOCKER_PRIVATE_NETWORK_NAME]: {
        external: true
      }
    };
  }

  /**
   * Set the staker pkg:
   * - ensures the staker pkg is installed
   * - connects the staker pkg to the staker network
   * - adds the staker network to the docker-compose file
   * - starts the staker pkg
   */
  protected async setStakerPkgConfig({
    dnpName,
    isInstalled,
    userSettings
  }: {
    dnpName: string;
    isInstalled: boolean;
    userSettings: UserSettings;
  }): Promise<void> {
    if (isInstalled) {
      await this.setInstalledStakerPkgConfig({ dnpName, userSettings });
    } else {
      await packageInstall(this.dappnodeInstaller, {
        name: dnpName,
        userSettings: userSettings ? { [dnpName]: userSettings } : {}
      });
    }
  }

  private async setInstalledStakerPkgConfig({
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
   * Unset staker pkg:
   * - disconnects the staker pkg from the staker network
   * - stops the staker pkg
   * - removes the staker network from the docker-compose file
   */
  private async unsetStakerPkgConfig({
    pkg,
    dockerNetworkName,
    fullnodeAliases
  }: {
    pkg: InstalledPackageData;
    dockerNetworkName: string;
    fullnodeAliases: string[];
  }): Promise<void> {
    this.removeStakerNetworkFromCompose(pkg.dnpName, dockerNetworkName);
    this.removeFullnodeAliasFromDncoreNetwork(pkg.dnpName, fullnodeAliases);

    // This recreates the package containers so that they include the recently added configuration
    // The flag --no-start is added so that the containers remain stopped after recreation
    await dockerComposeUpPackage({
      composeArgs: { dnpName: pkg.dnpName },
      upAll: false,
      dockerComposeUpOptions: { forceRecreate: true, noStart: true }
    });
  }

  private removeFullnodeAliasFromDncoreNetwork(dnpName: string, fullnodeAliases: string[]): void {
    const composeEditor = new ComposeFileEditor(dnpName, false);
    const services = composeEditor.compose.services;

    for (const [, service] of Object.entries(services)) {
      const serviceNetworks = service.networks;

      if (!serviceNetworks || Array.isArray(serviceNetworks)) continue;

      for (const [networkName, networkSettings] of Object.entries(serviceNetworks)) {
        if (networkName === params.DOCKER_PRIVATE_NETWORK_NAME) {
          const aliases = networkSettings.aliases;
          if (aliases) networkSettings.aliases = aliases.filter((alias) => !fullnodeAliases.includes(alias));
        }
      }
    }

    composeEditor.write();
  }

  private removeStakerNetworkFromCompose(dnpName: string, dockerNetworkName: string): void {
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

  private ensureCompatibilityRequirements(
    dnpName: string,
    compatibleClients: {
      dnpName: string;
      minVersion: string;
    }[],
    pkgVersion: string
  ): void {
    if (!dnpName) return;

    const compatibleClient = compatibleClients.find((c) => c.dnpName === dnpName);

    // ensure valid dnpName
    if (!compatibleClient) throw Error("The selected staker is not compatible with the current network");

    // ensure valid version
    if (compatibleClient?.minVersion && lt(pkgVersion, compatibleClient.minVersion)) {
      throw Error(
        `The selected staker version from ${dnpName} is not compatible with the current network. Required version: ${compatibleClient.minVersion}. Got: ${pkgVersion}`
      );
    }
  }
}
