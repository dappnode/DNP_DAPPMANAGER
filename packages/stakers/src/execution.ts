import {
  ExecutionClientGnosis,
  ExecutionClientHolesky,
  ExecutionClientLukso,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  Network,
  StakerItem,
} from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller, ethereumClient } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { listPackageNoThrow } from "@dappnode/dockerapi";

export class Execution extends StakerComponent {
  protected belongsToStakerNetwork = true;
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
    [Network.Lukso]: db.executionClientLukso,
  };

  protected static readonly CompatibleExecutions: Record<
    Network,
    { dnpName: string; minVersion: string }[]
  > = {
    [Network.Mainnet]: [
      { dnpName: ExecutionClientMainnet.Geth, minVersion: "0.1.37" },
      { dnpName: ExecutionClientMainnet.Nethermind, minVersion: "1.0.27" },
      { dnpName: ExecutionClientMainnet.Erigon, minVersion: "0.1.34" },
      { dnpName: ExecutionClientMainnet.Besu, minVersion: "1.2.6" },
    ],
    [Network.Gnosis]: [
      { dnpName: ExecutionClientGnosis.Nethermind, minVersion: "1.0.18" },
      { dnpName: ExecutionClientGnosis.Erigon, minVersion: "0.1.0" },
    ],
    [Network.Prater]: [
      { dnpName: ExecutionClientPrater.Geth, minVersion: "0.4.26" },
      { dnpName: ExecutionClientPrater.Erigon, minVersion: "0.1.0" },
      { dnpName: ExecutionClientPrater.Nethermind, minVersion: "1.0.1" },
      { dnpName: ExecutionClientPrater.Besu, minVersion: "0.1.0" },
    ],
    [Network.Holesky]: [
      { dnpName: ExecutionClientHolesky.Geth, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHolesky.Erigon, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHolesky.Nethermind, minVersion: "0.1.0" },
      { dnpName: ExecutionClientHolesky.Besu, minVersion: "0.1.0" },
    ],
    [Network.Lukso]: [
      { dnpName: ExecutionClientLukso.Geth, minVersion: "0.1.0" },
    ],
  };

  constructor(dappnodeInstaller: DappnodeInstaller) {
    super(dappnodeInstaller);
  }

  async getAllExecutions(network: Network): Promise<StakerItem[]> {
    return await super.getAll({
      dnpNames: Execution.CompatibleExecutions[network].map(
        (client) => client.dnpName
      ),
      currentClient: this.DbHandlers[network].get(),
    });
  }

  async persistSelectedExecutionIfInstalled(network: Network): Promise<void> {
    const currentExecutionDnpName = this.DbHandlers[network].get();
    if (
      currentExecutionDnpName &&
      (await listPackageNoThrow({ dnpName: currentExecutionDnpName }))
    ) {
      await this.persistSelectedIfInstalled(
        currentExecutionDnpName,
        this.belongsToStakerNetwork,
        {},
        currentExecutionDnpName
      );
    }
  }

  async setNewExecution(network: Network, newExecutionDnpName: string | null) {
    const prevExecClientDnpName = this.DbHandlers[network].get();
    logs.info(
      `Setting new execution client: ${newExecutionDnpName} (prev: ${prevExecClientDnpName})`
    );

    await super.setNew({
      newStakerDnpName: newExecutionDnpName,
      compatibleClients: Execution.CompatibleExecutions[network],
      belongsToStakerNetwork: this.belongsToStakerNetwork,
      executionFullnodeAlias: `execution.${network}.staker.dappnode`,
      prevClient: prevExecClientDnpName,
    });

    if (newExecutionDnpName !== prevExecClientDnpName) {
      // persist on db
      await this.DbHandlers[network].set(newExecutionDnpName);
      // update fullnode alias
      await ethereumClient.updateFullnodeAlias({
        network,
        newExecClientDnpName: newExecutionDnpName,
        prevExecClientDnpName: prevExecClientDnpName || "",
      });
    }
  }
}
