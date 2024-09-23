import { dockerComposeUpPackage, listPackageNoThrow, listPackages } from "@dappnode/dockerapi";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { DappnodeInstaller, packageGetData, packageInstall } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import { InstalledPackageData, StakerItem, UserSettings, Network } from "@dappnode/types";
import { getIsInstalled, getIsUpdated, getIsRunning, fileToGatewayUrl } from "@dappnode/utils";
import { lt } from "semver";
import { isMatch } from "lodash-es";
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

  protected async setNew({
    newStakerDnpName,
    dockerNetworkName,
    compatibleClients,
    userSettings,
    prevClient
  }: {
    newStakerDnpName: string | null | undefined;
    dockerNetworkName: string;
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
      if (prevClient !== newStakerDnpName) await this.unsetStakerPkgConfig(currentPkg, dockerNetworkName);
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
    let forceRecreate = false;

    if (userSettings) {
      const composeEditor = new ComposeFileEditor(dnpName, false);

      const previousSettings = composeEditor.getUserSettings();

      composeEditor.applyUserSettings(userSettings, { dnpName });
      const newSettings = composeEditor.getUserSettings();

      if (!isMatch(previousSettings, newSettings)) {
        composeEditor.write();
        forceRecreate = true;
        logs.info(`Settings for ${dnpName} have changed. Forcing recreation of containers.`);
      }
    }

    // start all containers
    await dockerComposeUpPackage({
      composeArgs: { dnpName },
      upAll: true,
      dockerComposeUpOptions: { forceRecreate }
    });
  }

  /**
   * Unset staker pkg:
   * - disconnects the staker pkg from the staker network
   * - stops the staker pkg
   * - removes the staker network from the docker-compose file
   */
  private async unsetStakerPkgConfig(pkg: InstalledPackageData, dockerNetworkName: string): Promise<void> {
    this.removeStakerNetworkFromCompose(pkg.dnpName, dockerNetworkName);

    // This recreates the package containers so that they include the recently added configuration
    // The flag --no-start is added so that the containers remain stopped after recreation
    await dockerComposeUpPackage({
      composeArgs: { dnpName: pkg.dnpName },
      upAll: false,
      dockerComposeUpOptions: { forceRecreate: true, noStart: true }
    });
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
