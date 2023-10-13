import { isEqual, uniq } from "lodash-es";
import { Eth2ClientTarget, EthClientRemote, ExecutionClient, InstalledPackageDetailData } from "@dappnode/common";
import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { logs } from "@dappnode/logger";
import { getConsensusUserSettings } from "../stakerConfig/utils.js";
import { packageGet } from "../../calls/packageGet.js";
import { packageInstall } from "../../calls/packageInstall.js";
import { packageRemove } from "../../calls/packageRemove.js";
import {
  ComposeFileEditor,
  parseServiceNetworks
} from "@dappnode/dockercompose";
import { params } from "@dappnode/params";
import {
  dockerComposeUpPackage,
  dockerNetworkReconnect,
  listPackageNoThrow,
  getDnCoreNetworkContainerConfig
} from "@dappnode/dockerapi";
import Dockerode from "dockerode";
import {
  ExecutionClientMainnet,
  ConsensusClientMainnet,
  Network
} from "@dappnode/types";
enum ComposeEditorAction {
  ADD,
  REMOVE
}

export class EthereumClient {

  /**
   * Computes the current eth2ClientTarget based on:
   * - remote
   * - executionClient
   * - consensusClient
   */
  computeEthereumTarget(): Eth2ClientTarget {
    const executionClient = db.executionClientMainnet.get();
    const consensusClient = db.consensusClientMainnet.get();
    const remote = db.ethClientRemote.get();
    switch (remote) {
      case null:
      case EthClientRemote.on:
        return "remote";

      case EthClientRemote.off:
        if (!executionClient || !consensusClient) return "remote";

        return {
          execClient: executionClient,
          consClient: consensusClient
        };
    }
  }

  /**
   * Changes the ethereum client used to fetch package data
   * @param nextTarget Ethereum client to change to
   * @param wait If set to true, the function will wait until the client is changed
   * @param deletePrevExecClient If set delete previous exec client
   * @param deletePrevConsClient If set delete previous cons client
   */
  async changeEthClient(
    nextTarget: Eth2ClientTarget,
    sync: boolean,
    useCheckpointSync: boolean,
    deletePrevExecClient: boolean,
    deletePrevExecClientVolumes: boolean,
    deletePrevConsClient: boolean,
    deletePrevConsClientVolumes: boolean
  ): Promise<void> {
    const currentTarget = this.computeEthereumTarget();
    // Return if the target is the same
    if (isEqual(nextTarget, currentTarget)) return;
    // Remove clients if currentTarge is !== remote
    if (currentTarget !== "remote") {
      // Remove Execution client
      if (deletePrevExecClient)
        await packageRemove({
          dnpName: currentTarget.execClient,
          deleteVolumes: deletePrevExecClientVolumes
        }).catch(e => logs.error(`Error removing prev exec client: ${e}`));
      // Remove Consensus client
      if (deletePrevConsClient)
        await packageRemove({
          dnpName: currentTarget.consClient,
          deleteVolumes: deletePrevConsClientVolumes
        }).catch(e => logs.error(`Error removing prev cons client: ${e}`));
    }

    if (nextTarget === "remote") {
      db.ethClientRemote.set(EthClientRemote.on);
      // Remove alias fullnode.dappnode from the eth client if not removed by the user
      if (!deletePrevExecClient && currentTarget !== "remote")
        await this.updateFullnodeAlias({
          network: "mainnet",
          prevExecClientDnpName: currentTarget.execClient
        }).catch(e =>
          logs.error(
            "Error removing fullnode.dappnode alias from previous ETH exec client",
            e
          )
        );
    } else {
      const { execClient, consClient } = nextTarget;
      db.ethClientRemote.set(EthClientRemote.off);
      await db.executionClientMainnet.set(execClient);
      await db.consensusClientMainnet.set(consClient);
      if (sync)
        await this.changeEthClientSync({
          prevExecClient: currentTarget !== "remote" ? currentTarget.execClient : undefined,
          execClient,
          consClient,
          useCheckpointSync
        });
      else
        await this.changeEthClientNotAsync({
          prevExecClient: currentTarget !== "remote" ? currentTarget.execClient : undefined,
          execClient,
          consClient,
          useCheckpointSync
        });
    }
  }

  /**
 * Updates the fullnode.dappnode alias when the execution client changes.
 * - For mainnet: fullnode.dappnode
 * - For other networks: <network>.fullnode.dappnode
 * 
 * @param newExecClientDnpName - New execution client to set.
 * @param network - Network to define the proper alias.
 */
  async updateFullnodeAlias<T extends Network>({
    prevExecClientDnpName,
    newExecClientDnpName,
    network = "mainnet" as T
  }: {
    prevExecClientDnpName?: ExecutionClient<T>;
    newExecClientDnpName?: ExecutionClient<T>;
    network?: T;
  }): Promise<void> {

    const fullnodeAlias = network === "mainnet" ? params.FULLNODE_ALIAS : `${network}.${params.FULLNODE_ALIAS}`;

    logs.info(`Updating fullnode alias (${fullnodeAlias}) for network ${network} from ${prevExecClientDnpName} to ${newExecClientDnpName}`);

    if (prevExecClientDnpName === newExecClientDnpName) return;

    if (prevExecClientDnpName) {
      logs.info(`Removing fullnode alias (${fullnodeAlias}) from previous execution client for network ${network} (${prevExecClientDnpName})`);
      await this.removeAliasFromPreviousExecClient({ execClientDnpName: prevExecClientDnpName, fullnodeAlias });
    }

    // New execution client can be undefined if the user sets remote Ethereum repository, for example
    if (newExecClientDnpName) {
      logs.info(`Adding fullnode alias (${fullnodeAlias}) to new execution client for network ${network} (${newExecClientDnpName})`);
      this.addAliasToNewExecClient({ execClientDnpName: newExecClientDnpName, fullnodeAlias });
    }

  }

  private async removeAliasFromPreviousExecClient<T extends Network>({ execClientDnpName, fullnodeAlias }: { execClientDnpName: ExecutionClient<T>, fullnodeAlias: string }): Promise<void> {
    const execClientPkg = await packageGet({ dnpName: execClientDnpName });

    const serviceName = this.getServiceNameFromPackage(execClientPkg);
    const containerName = this.getContainerNameFromService(execClientPkg, serviceName);

    await this.removeContainerAliasFromDockerNetwork({ containerName, fullnodeAlias });

    this.removeFullnodeAliasFromCompose({ execClientDnpName, execClientServiceName: serviceName, fullnodeAlias });
  }

  private async addAliasToNewExecClient<T extends Network>({ execClientDnpName, fullnodeAlias }: { execClientDnpName: ExecutionClient<T>, fullnodeAlias: string }): Promise<void> {
    const execClientPkg = await packageGet({ dnpName: execClientDnpName });

    const serviceName = this.getServiceNameFromPackage(execClientPkg);
    const containerName = this.getContainerNameFromService(execClientPkg, serviceName);

    this.addContainerAliasToDockerNetwork({ containerName, fullnodeAlias });

    this.addFullnodeAliasToCompose({ execClientDnpName, execClientServiceName: serviceName, fullnodeAlias });
  }

  private getServiceNameFromPackage(pkg: InstalledPackageDetailData): string {
    return pkg.manifest?.mainService || pkg.containers[0].serviceName;
  }

  private getContainerNameFromService(pkg: InstalledPackageDetailData, serviceName: string): string {
    return pkg.containers.find(container => container.serviceName === serviceName)?.containerName || pkg.containers[0].containerName;
  }

  private async removeContainerAliasFromDockerNetwork({ containerName, fullnodeAlias }: { containerName: string, fullnodeAlias: string }): Promise<void> {
    const currentEndpointConfig = await getDnCoreNetworkContainerConfig(containerName);

    const updatedAliases = (currentEndpointConfig?.Aliases || []).filter((alias: string) => alias !== fullnodeAlias);

    const endpointConfig: Partial<Dockerode.NetworkInfo> = {
      ...currentEndpointConfig,
      Aliases: updatedAliases
    };

    await dockerNetworkReconnect(
      params.DNP_PRIVATE_NETWORK_NAME,
      containerName,
      endpointConfig
    );

  }

  private async addContainerAliasToDockerNetwork({ containerName, fullnodeAlias }: { containerName: string, fullnodeAlias: string }): Promise<void> {
    const currentEndpointConfig = await getDnCoreNetworkContainerConfig(containerName);

    const endpointConfig: Partial<Dockerode.NetworkInfo> = {
      ...currentEndpointConfig,
      Aliases: uniq([
        ...(currentEndpointConfig?.Aliases || []),
        fullnodeAlias
      ])
    };

    await dockerNetworkReconnect(
      params.DNP_PRIVATE_NETWORK_NAME,
      containerName,
      endpointConfig
    );
  }

  /**
   * Changes the ethereum client synchronously
   */
  private async changeEthClientSync({
    prevExecClient,
    execClient,
    consClient,
    useCheckpointSync,
  }: {
    prevExecClient?: ExecutionClientMainnet,
    execClient: ExecutionClientMainnet,
    consClient: ConsensusClientMainnet,
    useCheckpointSync?: boolean,
  }): Promise<void> {
    try {

      // Install execution client and set default fullnode alias
      const execClientPackage = await listPackageNoThrow({
        dnpName: execClient
      });

      if (!execClientPackage) {
        logs.info(`Installing execution client ${execClient}`);
        await packageInstall({ name: execClient }).then(
          async () =>
            await this.updateFullnodeAlias({
              network: "mainnet",
              newExecClientDnpName: execClient,
              prevExecClientDnpName: prevExecClient
            })
        );
      } else {
        logs.info(`Starting execution client ${execClient}`);
        // Start pkg if not running
        if (execClientPackage.containers.some(c => c.state !== "running"))
          await dockerComposeUpPackage(
            { dnpName: execClient },
            {},
            {},
            true
          ).then(
            async () =>
              await this.updateFullnodeAlias({
                network: "mainnet",
                newExecClientDnpName: execClient,
                prevExecClientDnpName: prevExecClient
              })
          );
      }

      // Install consensus client
      const consClientPkg = await listPackageNoThrow({
        dnpName: execClient
      });
      if (!consClientPkg) {
        // Get default cons client user settings and install cons client
        const userSettings = getConsensusUserSettings({
          dnpName: consClient,
          network: "mainnet",
          useCheckpointSync,
          feeRecipient: db.feeRecipientMainnet.get() || ""
        });
        await packageInstall({ name: consClient, userSettings });
      } else {
        // Start pkg if not running
        if (consClientPkg.containers.some(c => c.state !== "running"))
          await dockerComposeUpPackage({ dnpName: consClient }, {}, {}, true);
      }
    } catch (e) {
      throw Error(`Error changing eth client: ${e}`);
    }
  }

  /**
   * Changes the ethereum client asynchronosly by triggering an event
   */
  private async changeEthClientNotAsync({
    prevExecClient,
    execClient,
    consClient,
    useCheckpointSync,
  }: {
    prevExecClient?: ExecutionClientMainnet,
    execClient: ExecutionClientMainnet,
    consClient: ConsensusClientMainnet,
    useCheckpointSync?: boolean,
  }): Promise<void> {

    db.ethExecClientInstallStatus.set(execClient, {
      status: "TO_INSTALL"
    });
    db.ethConsClientInstallStatus.set(consClient, {
      status: "TO_INSTALL"
    });
    eventBus.runEthClientInstaller.emit({ useCheckpointSync, prevExecClientDnpName: prevExecClient });
  }

  // Utils
  private editFullnodeAliasInCompose<T extends Network>({
    action,
    execClientDnpName,
    execClientServiceName,
    fullnodeAlias = params.FULLNODE_ALIAS,
  }: {
    action: ComposeEditorAction,
    execClientDnpName: ExecutionClient<T>,
    execClientServiceName: string,
    fullnodeAlias: string,
  }): void {
    const compose = new ComposeFileEditor(execClientDnpName, false);
    const composeService = compose.services()[execClientServiceName];
    const serviceNetworks = parseServiceNetworks(composeService.get().networks || {});
    const serviceNetwork = serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME] || null;

    if (action === ComposeEditorAction.REMOVE) {
      composeService.removeNetworkAliases(
        params.DNP_PRIVATE_NETWORK_NAME,
        [fullnodeAlias],
        serviceNetwork
      );
    } else {
      composeService.addNetworkAliases(
        params.DNP_PRIVATE_NETWORK_NAME,
        [fullnodeAlias],
        serviceNetwork
      );
    }

    compose.write();
  }

  // TODO: Function should be private
  public removeFullnodeAliasFromCompose<T extends Network>({
    execClientDnpName,
    execClientServiceName,
    fullnodeAlias = params.FULLNODE_ALIAS,
  }: {
    execClientDnpName: ExecutionClient<T>,
    execClientServiceName: string,
    fullnodeAlias?: string,
  }): void {
    this.editFullnodeAliasInCompose({
      action: ComposeEditorAction.REMOVE,
      execClientDnpName,
      execClientServiceName,
      fullnodeAlias,
    });
  }

  // TODO: Function should be private
  public addFullnodeAliasToCompose<T extends Network>({
    execClientDnpName,
    execClientServiceName,
    fullnodeAlias = params.FULLNODE_ALIAS,
  }: {
    execClientDnpName: ExecutionClient<T>,
    execClientServiceName: string,
    fullnodeAlias?: string,
  }): void {
    this.editFullnodeAliasInCompose({
      action: ComposeEditorAction.ADD,
      execClientDnpName,
      execClientServiceName,
      fullnodeAlias,
    });
  }
}
