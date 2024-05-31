import { Network, StakerItem } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller, ethereumClient } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";

export class Execution extends StakerComponent {
  protected belongsToStakerNetwork = true;
  protected static readonly DbHandlers: Record<
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
      { dnpName: "geth.dnp.dappnode.eth", minVersion: "0.1.37" },
      { dnpName: "nethermind.public.dappnode.eth", minVersion: "1.0.27" },
      { dnpName: "erigon.dnp.dappnode.eth", minVersion: "0.1.34" },
      { dnpName: "besu.public.dappnode.eth", minVersion: "1.2.6" },
    ],
    [Network.Gnosis]: [
      { dnpName: "nethermind-xdai.dnp.dappnode.eth", minVersion: "1.0.18" },
      { dnpName: "gnosis-erigon.dnp.dappnode.eth", minVersion: "0.1.0" },
    ],
    [Network.Prater]: [
      { dnpName: "goerli-geth.dnp.dappnode.eth", minVersion: "0.4.26" },
      { dnpName: "goerli-erigon.dnp.dappnode.eth", minVersion: "0.1.0" },
      { dnpName: "goerli-nethermind.dnp.dappnode.eth", minVersion: "1.0.1" },
      { dnpName: "goerli-besu.dnp.dappnode.eth", minVersion: "0.1.0" },
    ],
    [Network.Holesky]: [
      { dnpName: "holesky-geth.dnp.dappnode.eth", minVersion: "0.1.0" },
      { dnpName: "holesky-erigon.dnp.dappnode.eth", minVersion: "0.1.0" },
      { dnpName: "holesky-nethermind.dnp.dappnode.eth", minVersion: "0.1.0" },
      { dnpName: "holesky-besu.dnp.dappnode.eth", minVersion: "0.1.0" },
    ],
    [Network.Lukso]: [
      { dnpName: "lukso-geth.dnp.dappnode.eth", minVersion: "0.1.0" },
      /*{
        dnpName: "lukso-erigon.dnp.dappnode.eth",
        minVersion: "0.1.0"
      }*/
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
      currentClient: Execution.DbHandlers[network].get(),
    });
  }

  async setNewExecution(network: Network, newExecutionDnpName: string | null) {
    const prevExecClientDnpName = Execution.DbHandlers[network].get();
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
      await Execution.DbHandlers[network].set(newExecutionDnpName);
      // update fullnode alias
      await ethereumClient.updateFullnodeAlias({
        network,
        newExecClientDnpName: newExecutionDnpName,
        prevExecClientDnpName: prevExecClientDnpName || "",
      });
    }
  }
}
