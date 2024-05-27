import { InstalledPackageData, Network } from "@dappnode/types";
import { StakerComponent } from "./stakerComponent.js";
import { DappnodeInstaller, ethereumClient } from "@dappnode/installer";

export class Execution extends StakerComponent {
  protected network: Network;
  protected executionFullnodeAlias: string;
  protected belongsToStakerNetwork = true;
  protected compatibleExecutions: {
    dnpName: string;
    minVersion: string;
  }[];

  constructor(
    pkg: InstalledPackageData | null,
    dappnodeInstaller: DappnodeInstaller,
    network: Network
  ) {
    super(pkg, dappnodeInstaller);
    this.network = network;
    this.executionFullnodeAlias = `execution.${this.network}.staker.dappnode`;
    this.compatibleExecutions = this.getCompatibleExecutions();
  }

  async setNewExecution(newExecutionDnpName: string | null) {
    await super.setNew({
      newStakerDnpName: newExecutionDnpName,
      compatibleClients: this.compatibleExecutions,
      belongsToStakerNetwork: this.belongsToStakerNetwork,
      executionFullnodeAlias: this.executionFullnodeAlias,
    });
    await ethereumClient.updateFullnodeAlias({
      network: this.network,
      newExecClientDnpName: newExecutionDnpName,
      prevExecClientDnpName: this.pkg?.dnpName,
    });
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
