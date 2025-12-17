import {
  ExecutionClientGnosis,
  ExecutionClientHolesky,
  ExecutionClientHoodi,
  ExecutionClientSepolia,
  ExecutionClientLukso,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  Network,
  StakerItem,
  UserSettings
} from "@dappnode/types";
import { Blockchain } from "../blockchain.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { listPackage } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { gt } from "semver";

// TODO: move ethereumClient logic here

export class Execution extends Blockchain {
  readonly DbHandlers: Record<
    Network,
    {
      get: () => string | null | undefined;
      set: (globEnvValue: string | null | undefined) => Promise<void>;
    }
  > = {
    [Network.Mainnet]: db.executionClientMainnet,
    [Network.Gnosis]: db.executionClientGnosis,
    [Network.Prater]: db.executionClientPrater,
    [Network.Holesky]: db.executionClientHolesky,
    [Network.Sepolia]: db.executionClientSepolia,
    [Network.Hoodi]: db.executionClientHoodi,
    [Network.Lukso]: db.executionClientLukso
  };

  protected static readonly CompatibleExecutions: Record<Network, { dnpName: string; minVersion: string }[]> = {
    [Network.Mainnet]: [
      { dnpName: ExecutionClientMainnet.Reth, minVersion: "0.1.0" },
      { dnpName: ExecutionClientMainnet.Geth, minVersion: "0.1.37" },
      { dnpName: ExecutionClientMainnet.Nethermind, minVersion: "1.0.27" },
      { dnpName: ExecutionClientMainnet.Erigon, minVersion: "0.1.34" },
      { dnpName: ExecutionClientMainnet.Besu, minVersion: "1.2.6" }
    ],
    [Network.Gnosis]: [
      { dnpName: ExecutionClientGnosis.Nethermind, minVersion: "1.0.18" },
      { dnpName: ExecutionClientGnosis.Erigon, minVersion: "0.1.0" },
      { dnpName: ExecutionClientGnosis.Geth, minVersion: "0.1.0" },
      { dnpName: ExecutionClientGnosis.Reth, minVersion: "0.1.0" }
    ],
    [Network.Prater]: [
      { dnpName: ExecutionClientPrater.Geth, minVersion: "0.4.26" },
      { dnpName: ExecutionClientPrater.Erigon, minVersion: "0.1.0" },
      { dnpName: ExecutionClientPrater.Nethermind, minVersion: "1.0.1" },
      { dnpName: ExecutionClientPrater.Besu, minVersion: "0.1.0" }
    ],
    [Network.Holesky]: [
      { dnpName: ExecutionClientHolesky.Reth, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHolesky.Geth, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHolesky.Erigon, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHolesky.Nethermind, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHolesky.Besu, minVersion: "0.1.0" }
    ],
    [Network.Hoodi]: [
      { dnpName: ExecutionClientHoodi.Reth, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHoodi.Geth, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHoodi.Erigon, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHoodi.Nethermind, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHoodi.Besu, minVersion: "0.1.0" }
    ],
    [Network.Sepolia]: [
      { dnpName: ExecutionClientSepolia.Geth, minVersion: "0.1.3" },
      { dnpName: ExecutionClientSepolia.Reth, minVersion: "0.1.0" }
    ],
    [Network.Lukso]: [{ dnpName: ExecutionClientLukso.Geth, minVersion: "0.1.0" }]
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllExecutions(network: Network): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: Execution.CompatibleExecutions[network].map((client) => client.dnpName),
      currentClient: this.DbHandlers[network].get()
    });
  }

  async persistSelectedExecutionIfInstalled(network: Network): Promise<void> {
    const currentExecutionDnpName = this.DbHandlers[network].get();
    if (currentExecutionDnpName) {
      const isInstalled = await this.isPackageInstalled(currentExecutionDnpName);

      if (!isInstalled) {
        // update status in db
        this.DbHandlers[network].set(undefined);
        return;
      }

      const userSettings = await this.getUserSettings(network, currentExecutionDnpName);

      await this.setBlockchainPkgConfig({ dnpName: currentExecutionDnpName, isInstalled, userSettings });

      await this.DbHandlers[network].set(currentExecutionDnpName);
    }
  }

  async setNewExecution(network: Network, newExecutionDnpName: string | null) {
    const prevExecClientDnpName = this.DbHandlers[network].get();

    await super.setNew({
      newBlockchainDnpName: newExecutionDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      fullnodeAliases: [`execution.${network}.dncore.dappnode`],
      compatibleClients: Execution.CompatibleExecutions[network],
      userSettings: await this.getUserSettings(network, newExecutionDnpName),
      prevClient: prevExecClientDnpName
    });

    if (newExecutionDnpName !== prevExecClientDnpName) {
      // persist on db
      await this.DbHandlers[network].set(newExecutionDnpName);
    }
  }

  private async getUserSettings(network: Network, dnpName: string | null): Promise<UserSettings> {
    if (!dnpName) return {};

    const execService = await this.getExecutionServiceName(dnpName);

    return {
      networks: {
        rootNetworks: this.getComposeRootNetworks(network),
        serviceNetworks: {
          [execService]: {
            [params.DOCKER_STAKER_NETWORKS[network]]: {
              aliases: [`execution.${network}.staker.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NAME]: {
              aliases: [`execution.${network}.dncore.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NEW_NAME]: {
              aliases: [`execution.${network}.dappnode.private`]
            }
          }
        }
      }
    };
  }

  /**
   * This function returns the execution service name for a given dnpName.
   * Useful for setting the execution service network aliases.
   *
   * @description The execution service name should be same accross all execution packages
   * but currently it is not. So we need to find the service name for each package.
   *
   * Logic: find the service with an image that contains the execution dnpName
   * - e.g. for mainnet: "reth.dnp.dappnode.eth:2.0.0" -> service name: "reth"
   *
   * NOTE: Reth is the only package that has a different service name for the execution from the
   * service image name. Reth starts with "reth" but the service image name is "reth.dnp.dappnode.eth:version"
   *
   * @param dnpName
   * @returns execution service name
   */
  private async getExecutionServiceName(dnpName: string): Promise<string> {
    const isInstalled = await this.isPackageInstalled(dnpName);

    if (isInstalled) {
      const pkg = await listPackage({ dnpName });
      const execService = pkg.containers.find((container) => container.serviceName.includes("reth"))
        ? "reth"
        : pkg.containers[0].serviceName;

      if (!execService) {
        logs.error(`Could not find execution service name for ${dnpName}, using dnpName instead`);
        return dnpName.split(".")[0];
      }
      // Some clients are versioned such as geth-v1-26-0-2 but service name is geth
      // Version is introduced by -v and can contain numbers and dashes
      return execService.replace(/-v[\d-]+$/, "");
    }

    // If is a reth package, the service name is "reth" instead of the first part of the dnpName
    // this is because the container version is different from the service name in reth packages
    if (dnpName.includes("reth")) return "reth";

    // If not installed: the service name is the first part of the dnpName
    return dnpName.split(".")[0];
  }

  /**
   * This function checks if the current execution package has a newer version that needs to be installed
   * because the execution service has been changed to a newer versioned service
   * (i.e., geth -> geth-v1-26-0-2)
   *
   * We need the installed version to be greater than the new versioned service release and the service
   * image version to be different from the first part of the dnpName
   */
  async executionNeedsToBeReinstalled(network: Network): Promise<boolean> {
    const currentExecutionDnpName = this.DbHandlers[network].get();
    if (!currentExecutionDnpName) return false;
    const isInstalled = await this.isPackageInstalled(currentExecutionDnpName);

    if (!isInstalled) return false;

    const newVersionedReleases = this.getNewVersionedServiceRelease(network, currentExecutionDnpName);

    if (!newVersionedReleases) return false;

    const pkg = await listPackage({ dnpName: currentExecutionDnpName });

    if (gt(pkg.version, newVersionedReleases.version)) return false;

    const allServicesContainsNewVersionedService = pkg.containers.every(
      (container) =>
        container.serviceName === newVersionedReleases.service ||
        container.serviceName.startsWith(newVersionedReleases.service)
    );

    if (allServicesContainsNewVersionedService) return false;

    return true;
  }

  private getNewVersionedServiceRelease(
    network: Network,
    dnpName: string
  ): { service: string; version: string } | null {
    const newVersionedServiceReleases: Record<Network, Record<string, { service: string; version: string }>> = {
      [Network.Mainnet]: {
        [ExecutionClientMainnet.Geth]: {
          service: "geth",
          version: "0.1.51"
        }
      },
      [Network.Gnosis]: {},
      [Network.Prater]: {},
      [Network.Holesky]: {},
      [Network.Hoodi]: {},
      [Network.Sepolia]: {},
      [Network.Lukso]: {}
    };

    return newVersionedServiceReleases[network][dnpName] || null;
  }
}
