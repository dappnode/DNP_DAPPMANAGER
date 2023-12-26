import { isEqual, uniq } from "lodash-es";
import {
  Eth2ClientTarget,
  EthClientRemote,
  ExecutionClient,
  InstalledPackageDetailData,
} from "@dappnode/common";
import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { logs } from "@dappnode/logger";
import { getConsensusUserSettings } from "@dappnode/utils";
import { packageInstall, packageGet, packageRemove } from "../calls/index.js";
import {
  ComposeFileEditor,
  parseServiceNetworks,
} from "@dappnode/dockercompose";
import { params } from "@dappnode/params";
import {
  dockerComposeUpPackage,
  dockerNetworkReconnect,
  listPackageNoThrow,
  getNetworkContainerConfig,
} from "@dappnode/dockerapi";
import {
  ExecutionClientMainnet,
  ConsensusClientMainnet,
  Network,
} from "@dappnode/common";
import { DappnodeInstaller } from "../dappnodeInstaller.js";

export enum ComposeAliasEditorAction {
  ADD,
  REMOVE,
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
          consClient: consensusClient,
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
    dappnodeInstaller: DappnodeInstaller,
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
          deleteVolumes: deletePrevExecClientVolumes,
        }).catch((e) => logs.error(`Error removing prev exec client: ${e}`));
      // Remove Consensus client
      if (deletePrevConsClient)
        await packageRemove({
          dnpName: currentTarget.consClient,
          deleteVolumes: deletePrevConsClientVolumes,
        }).catch((e) => logs.error(`Error removing prev cons client: ${e}`));
    }

    if (nextTarget === "remote") {
      db.ethClientRemote.set(EthClientRemote.on);
      // Remove alias fullnode.dappnode from the eth client if not removed by the user
      if (!deletePrevExecClient && currentTarget !== "remote")
        await this.updateFullnodeAlias({
          network: "mainnet",
          prevExecClientDnpName: currentTarget.execClient,
        }).catch((e) =>
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
          dappnodeInstaller,
          prevExecClient:
            currentTarget !== "remote" ? currentTarget.execClient : undefined,
          execClient,
          consClient,
          useCheckpointSync,
        });
      else
        await this.changeEthClientNotAsync({
          prevExecClient:
            currentTarget !== "remote" ? currentTarget.execClient : undefined,
          execClient,
          consClient,
          useCheckpointSync,
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
    network = "mainnet" as T,
  }: {
    prevExecClientDnpName?: ExecutionClient<T>;
    newExecClientDnpName?: ExecutionClient<T>;
    network?: T;
  }): Promise<void> {
    const fullnodeAlias =
      network === "mainnet"
        ? params.FULLNODE_ALIAS
        : `${network}.${params.FULLNODE_ALIAS}`;

    logs.info(
      `Updating fullnode alias (${fullnodeAlias}) for network ${network} from ${prevExecClientDnpName} to ${newExecClientDnpName}`
    );

    if (prevExecClientDnpName === newExecClientDnpName) return;

    if (prevExecClientDnpName) {
      logs.info(
        `Removing fullnode alias (${fullnodeAlias}) from previous execution client for network ${network} (${prevExecClientDnpName})`
      );
      await this.removeAliasFromPreviousExecClient({
        execClientDnpName: prevExecClientDnpName,
        fullnodeAlias,
      });
    }

    // New execution client can be undefined if the user sets remote Ethereum repository, for example
    if (newExecClientDnpName) {
      logs.info(
        `Adding fullnode alias (${fullnodeAlias}) to new execution client for network ${network} (${newExecClientDnpName})`
      );
      this.addAliasToNewExecClient({
        execClientDnpName: newExecClientDnpName,
        fullnodeAlias,
      });
    }
  }

  private async removeAliasFromPreviousExecClient<T extends Network>({
    execClientDnpName,
    fullnodeAlias,
  }: {
    execClientDnpName: ExecutionClient<T>;
    fullnodeAlias: string;
  }): Promise<void> {
    const execClientPkg = await packageGet({ dnpName: execClientDnpName });

    const serviceName = this.getServiceNameFromPackage(execClientPkg);
    const containerName = this.getContainerNameFromService(
      execClientPkg,
      serviceName
    );

    await this.removeContainerAliasFromDockerNetwork({
      containerName,
      aliasToRemove: fullnodeAlias,
    });

    this.editFullnodeAliasInCompose({
      action: ComposeAliasEditorAction.REMOVE,
      execClientDnpName,
      execClientServiceName: serviceName,
      alias: fullnodeAlias,
    });
  }

  private async addAliasToNewExecClient<T extends Network>({
    execClientDnpName,
    fullnodeAlias,
  }: {
    execClientDnpName: ExecutionClient<T>;
    fullnodeAlias: string;
  }): Promise<void> {
    const execClientPkg = await packageGet({ dnpName: execClientDnpName });

    const serviceName = this.getServiceNameFromPackage(execClientPkg);
    const containerName = this.getContainerNameFromService(
      execClientPkg,
      serviceName
    );

    this.addContainerAliasToDockerNetwork({
      containerName,
      aliasToAdd: fullnodeAlias,
    });

    this.editFullnodeAliasInCompose({
      action: ComposeAliasEditorAction.ADD,
      execClientDnpName,
      execClientServiceName: serviceName,
      alias: fullnodeAlias,
    });
  }

  private getServiceNameFromPackage(pkg: InstalledPackageDetailData): string {
    return pkg.manifest?.mainService || pkg.containers[0].serviceName;
  }

  private getContainerNameFromService(
    pkg: InstalledPackageDetailData,
    serviceName: string
  ): string {
    return (
      pkg.containers.find((container) => container.serviceName === serviceName)
        ?.containerName || pkg.containers[0].containerName
    );
  }

  private async removeContainerAliasFromDockerNetwork({
    containerName,
    aliasToRemove,
  }: {
    containerName: string;
    aliasToRemove: string;
  }): Promise<void> {
    const currentEndpointConfig = await getNetworkContainerConfig(
      containerName,
      params.DOCKER_PRIVATE_NETWORK_NAME
    );

    const updatedAliases = (currentEndpointConfig?.Aliases || []).filter(
      (alias: string) => alias !== aliasToRemove
    );

    const endpointConfig = {
      ...currentEndpointConfig,
      Aliases: updatedAliases,
    };

    await dockerNetworkReconnect(
      params.DOCKER_PRIVATE_NETWORK_NAME,
      containerName,
      endpointConfig
    );
  }

  private async addContainerAliasToDockerNetwork({
    containerName,
    aliasToAdd,
  }: {
    containerName: string;
    aliasToAdd: string;
  }): Promise<void> {
    const currentEndpointConfig = await getNetworkContainerConfig(
      containerName,
      params.DOCKER_PRIVATE_NETWORK_NAME
    );

    const endpointConfig = {
      ...currentEndpointConfig,
      Aliases: uniq([...(currentEndpointConfig?.Aliases || []), aliasToAdd]),
    };

    await dockerNetworkReconnect(
      params.DOCKER_PRIVATE_NETWORK_NAME,
      containerName,
      endpointConfig
    );
  }

  /**
   * Changes the ethereum client synchronously
   */
  private async changeEthClientSync({
    dappnodeInstaller,
    prevExecClient,
    execClient,
    consClient,
    useCheckpointSync,
  }: {
    dappnodeInstaller: DappnodeInstaller;
    prevExecClient?: ExecutionClientMainnet;
    execClient: ExecutionClientMainnet;
    consClient: ConsensusClientMainnet;
    useCheckpointSync?: boolean;
  }): Promise<void> {
    try {
      // Install execution client and set default fullnode alias
      const execClientPackage = await listPackageNoThrow({
        dnpName: execClient,
      });

      if (!execClientPackage) {
        logs.info(`Installing execution client ${execClient}`);
        await packageInstall(dappnodeInstaller, { name: execClient }).then(
          async () =>
            await this.updateFullnodeAlias({
              network: "mainnet",
              newExecClientDnpName: execClient,
              prevExecClientDnpName: prevExecClient,
            })
        );
      } else {
        logs.info(`Starting execution client ${execClient}`);
        // Start pkg if not running
        if (execClientPackage.containers.some((c) => c.state !== "running"))
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
                prevExecClientDnpName: prevExecClient,
              })
          );
      }

      // Install consensus client
      const consClientPkg = await listPackageNoThrow({
        dnpName: execClient,
      });
      if (!consClientPkg) {
        // Get default cons client user settings and install cons client
        const userSettings = getConsensusUserSettings({
          dnpName: consClient,
          network: "mainnet",
          useCheckpointSync,
        });
        await packageInstall(dappnodeInstaller, {
          name: consClient,
          userSettings,
        });
      } else {
        // Start pkg if not running
        if (consClientPkg.containers.some((c) => c.state !== "running"))
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
    prevExecClient?: ExecutionClientMainnet;
    execClient: ExecutionClientMainnet;
    consClient: ConsensusClientMainnet;
    useCheckpointSync?: boolean;
  }): Promise<void> {
    db.ethExecClientInstallStatus.set(execClient, {
      status: "TO_INSTALL",
    });
    db.ethConsClientInstallStatus.set(consClient, {
      status: "TO_INSTALL",
    });
    eventBus.runEthClientInstaller.emit({
      useCheckpointSync,
      prevExecClientDnpName: prevExecClient,
    });
  }

  // Utils

  // TODO: Should be private
  public editFullnodeAliasInCompose<T extends Network>({
    action,
    execClientDnpName,
    execClientServiceName,
    alias = params.FULLNODE_ALIAS,
  }: {
    action: ComposeAliasEditorAction;
    execClientDnpName: ExecutionClient<T>;
    execClientServiceName: string;
    alias: string;
  }): void {
    const compose = new ComposeFileEditor(execClientDnpName, false);
    const composeService = compose.services()[execClientServiceName];
    const serviceNetworks = parseServiceNetworks(
      composeService.get().networks || {}
    );
    const serviceNetwork =
      serviceNetworks[params.DOCKER_PRIVATE_NETWORK_NAME] || null;

    if (action === ComposeAliasEditorAction.REMOVE) {
      composeService.removeNetworkAliases(
        params.DOCKER_PRIVATE_NETWORK_NAME,
        [alias],
        serviceNetwork
      );
    } else {
      composeService.addNetworkAliases(
        params.DOCKER_PRIVATE_NETWORK_NAME,
        [alias],
        serviceNetwork
      );
    }

    compose.write();
  }
}
