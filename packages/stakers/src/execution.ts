import {
  ExecutionClientGnosis,
  ExecutionClientHolesky,
  ExecutionClientLukso,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  Network,
  StakerItem,
  UserSettings
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller, ethereumClient } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { params } from "@dappnode/params";

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
    [Network.Lukso]: db.executionClientLukso
  };

  protected static readonly CompatibleExecutions: Record<Network, { dnpName: string; minVersion: string }[]> = {
    [Network.Mainnet]: [
      { dnpName: ExecutionClientMainnet.Geth, minVersion: "0.1.37" },
      { dnpName: ExecutionClientMainnet.Nethermind, minVersion: "1.0.27" },
      { dnpName: ExecutionClientMainnet.Erigon, minVersion: "0.1.34" },
      { dnpName: ExecutionClientMainnet.Besu, minVersion: "1.2.6" }
    ],
    [Network.Gnosis]: [
      { dnpName: ExecutionClientGnosis.Nethermind, minVersion: "1.0.18" },
      { dnpName: ExecutionClientGnosis.Erigon, minVersion: "0.1.0" }
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

      await this.persistSelectedIfInstalled({
        dnpName: currentExecutionDnpName,
        userSettings: this.getUserSettings(network, currentExecutionDnpName)
      });
      await this.DbHandlers[network].set(currentExecutionDnpName);
    }
  }

  async setNewExecution(network: Network, newExecutionDnpName: string | null) {
    const prevExecClientDnpName = this.DbHandlers[network].get();

    await super.setNew({
      newStakerDnpName: newExecutionDnpName,
      dockerNetworkName: params.DOCKER_STAKER_NETWORKS[network],
      compatibleClients: Execution.CompatibleExecutions[network],
      userSettings: this.getUserSettings(network, newExecutionDnpName),
      prevClient: prevExecClientDnpName
    });

    if (newExecutionDnpName !== prevExecClientDnpName) {
      // persist on db
      await this.DbHandlers[network].set(newExecutionDnpName);
      // update fullnode alias
      await ethereumClient.updateFullnodeAlias({
        network,
        newExecClientDnpName: newExecutionDnpName,
        prevExecClientDnpName: prevExecClientDnpName || ""
      });
    }
  }

  private getUserSettings(network: Network, dnpName: string | null): UserSettings {
    if (!dnpName) return {};

    return {
      networks: {
        rootNetworks: this.getComposeRootNetworks(network),
        serviceNetworks: {
          [this.getExecutionServiceName(dnpName)]: {
            [params.DOCKER_STAKER_NETWORKS[network]]: {
              aliases: [`execution.${network}.staker.dappnode`]
            },
            [params.DOCKER_PRIVATE_NETWORK_NAME]: {
              aliases: [`execution.${network}.dncore.dappnode`]
            }
          }
        }
      }
    };
  }

  /**
   * Returns the service name of the execution client
   *
   * TODO: find a better way to get the service name of the execution client or force execution clients to have same service name "execution", similar as consensus clients with beacon-chain and validator services
   */
  private getExecutionServiceName(dnpName: string): string {
    // TODO: geth mainnet is the only execution with service name === dnpName. See https://github.com/dappnode/DAppNodePackage-geth/blob/7e8e5aa860a8861986f675170bfa92215760d32e/docker-compose.yml#L3
    if (dnpName === ExecutionClientMainnet.Geth) return ExecutionClientMainnet.Geth;
    if (dnpName.includes("geth")) return "geth";
    if (dnpName.includes("nethermind")) return "nethermind";
    if (dnpName.includes("erigon")) return "erigon";
    if (dnpName.includes("besu")) return "besu";
    if (dnpName.includes("reth")) return "reth";

    return dnpName;
  }
}
