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
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { ComposeFileEditor } from "@dappnode/dockercompose";

// TODO: move ethereumClient logic here

export class Execution extends StakerComponent {
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

      await this.setStakerPkgConfig({ dnpName: currentExecutionDnpName, isInstalled, userSettings });

      await this.DbHandlers[network].set(currentExecutionDnpName);
    }
  }

  async setNewExecution(network: Network, newExecutionDnpName: string | null) {
    const prevExecClientDnpName = this.DbHandlers[network].get();

    await super.setNew({
      newStakerDnpName: newExecutionDnpName,
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
   * Returns the service name of the execution client by reading the compose file
   */
  private async getExecutionServiceName(dnpName: string): Promise<string> {
    try {
      const isInstalled = await this.isPackageInstalled(dnpName);
      // Get compose from installed package or from the release
      const compose = isInstalled
        ? new ComposeFileEditor(dnpName, false).output()
        : (await this.dappnodeInstaller.getRelease(dnpName)).compose;

      const serviceNames = Object.keys(compose.services);

      if (serviceNames.length === 0) {
        throw new Error(`No services found in compose for ${dnpName}`);
      }

      // Return the first service name (execution clients typically have one service)
      const serviceName = serviceNames[0];
      logs.info(`Execution client ${dnpName} has service name: ${serviceName}`);
      return serviceName;
    } catch (error) {
      logs.error(`Error getting service name for ${dnpName}, falling back to package name`, error);
      return dnpName;
    }
  }
}
