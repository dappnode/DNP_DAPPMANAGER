import { Network } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller, ethereumClient } from "@dappnode/installer";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";

export class Execution extends StakerComponent {
  protected executionFullnodeAlias: string;
  protected belongsToStakerNetwork = true;
  protected compatibleExecutions: {
    dnpName: string;
    minVersion: string;
  }[];

  constructor(dappnodeInstaller: DappnodeInstaller, network: Network) {
    super(network, dappnodeInstaller);
    this.executionFullnodeAlias = `execution.${this.network}.staker.dappnode`;
    this.compatibleExecutions = this.getCompatibleExecutions();
  }

  async setNewExecution(newExecutionDnpName: string | null) {
    const dbHandler = this.getDbHandler();
    const prevExecClientDnpName = dbHandler.get();
    logs.info(
      `Setting new execution client: ${newExecutionDnpName} (prev: ${prevExecClientDnpName})`
    );

    await super.setNew({
      newStakerDnpName: newExecutionDnpName,
      compatibleClients: this.compatibleExecutions,
      belongsToStakerNetwork: this.belongsToStakerNetwork,
      executionFullnodeAlias: this.executionFullnodeAlias,
      prevClient: prevExecClientDnpName,
    });

    if (newExecutionDnpName !== prevExecClientDnpName) {
      // persist on db
      await dbHandler.set(newExecutionDnpName);
      // update fullnode alias
      await ethereumClient.updateFullnodeAlias({
        network: this.network,
        newExecClientDnpName: newExecutionDnpName,
        prevExecClientDnpName: prevExecClientDnpName || "",
      });
    }
  }

  private getDbHandler(): {
    get: () => string | null | undefined;
    set: (globEnvValue: string | null | undefined) => Promise<void>;
  } {
    switch (this.network) {
      case Network.Mainnet:
        return db.executionClientMainnet;
      case Network.Gnosis:
        return db.executionClientGnosis;
      case Network.Prater:
        return db.executionClientPrater;
      case Network.Holesky:
        return db.executionClientHolesky;
      case Network.Lukso:
        return db.executionClientLukso;
      default:
        throw Error(`Unsupported network: ${this.network}`);
    }
  }

  private getCompatibleExecutions(): {
    dnpName: string;
    minVersion: string;
  }[] {
    switch (this.network) {
      case "mainnet":
        return [
          {
            dnpName: "geth.dnp.dappnode.eth",
            minVersion: "0.1.37",
          },
          {
            dnpName: "nethermind.public.dappnode.eth",
            minVersion: "1.0.27",
          },
          {
            dnpName: "erigon.dnp.dappnode.eth",
            minVersion: "0.1.34",
          },
          {
            dnpName: "besu.public.dappnode.eth",
            minVersion: "1.2.6",
          },
        ];
      case "gnosis":
        return [
          {
            dnpName: "nethermind-xdai.dnp.dappnode.eth",
            minVersion: "1.0.18",
          },
          {
            dnpName: "gnosis-erigon.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
        ];
      case "prater":
        return [
          {
            dnpName: "goerli-geth.dnp.dappnode.eth",
            minVersion: "0.4.26",
          },
          {
            dnpName: "goerli-erigon.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
          {
            dnpName: "goerli-nethermind.dnp.dappnode.eth",
            minVersion: "1.0.1",
          },
          {
            dnpName: "goerli-besu.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
        ];

      case "holesky":
        return [
          {
            dnpName: "holesky-geth.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
          {
            dnpName: "holesky-erigon.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
          {
            dnpName: "holesky-nethermind.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
          {
            dnpName: "holesky-besu.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
        ];
      case "lukso":
        return [
          {
            dnpName: "lukso-geth.dnp.dappnode.eth",
            minVersion: "0.1.0",
          },
          /*{
            dnpName: "lukso-erigon.dnp.dappnode.eth" ,
            minVersion: "0.1.0"
          }*/
        ];
      default:
        throw Error(`Unsupported network: ${this.network}`);
    }
  }
}
