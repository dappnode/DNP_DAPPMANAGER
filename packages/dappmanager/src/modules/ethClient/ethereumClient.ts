import { isEqual } from "lodash";
import {
  ConsensusClientMainnet,
  Eth2ClientTarget,
  EthClientRemote,
  ExecutionClientMainnet
} from "../../common";
import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { logs } from "../../logs";
import { getConsensusUserSettings } from "../stakerConfig/utils";
import { packageGet } from "../../calls/packageGet";
import { packageInstall } from "../../calls/packageInstall";
import { packageRemove } from "../../calls/packageRemove";
import { ComposeFileEditor } from "../compose/editor";
import { parseServiceNetworks } from "../compose/networks";
import params from "../../params";
import {
  dockerContainerInspect,
  dockerNetworkConnect,
  dockerNetworkDisconnect
} from "../docker";
import Dockerode from "dockerode";

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
    useCheckpointSync?: boolean,
    deletePrevExecClient?: boolean,
    deletePrevConsClient?: boolean
  ): Promise<void> {
    const currentTarget = this.computeEthereumTarget();
    // Return if the target is the same
    if (isEqual(nextTarget, currentTarget)) return;
    // Remove clients if currentTarge is !== remote
    if (currentTarget !== "remote") {
      // Remove Execution client
      if (deletePrevExecClient)
        await packageRemove({ dnpName: currentTarget.execClient }).catch(e =>
          logs.error(`Error removing prev exec client: ${e}`)
        );
      // Remove Consensus client
      if (deletePrevConsClient)
        await packageRemove({ dnpName: currentTarget.consClient }).catch(e =>
          logs.error(`Error removing prev cons client: ${e}`)
        );
    }

    if (nextTarget === "remote") {
      db.ethClientRemote.set(EthClientRemote.on);
      // Remove alias fullnode.dappnode from the eth client if not removed by the user
      if (!deletePrevExecClient && currentTarget !== "remote")
        await this.setDefaultEthClientFullNode({
          dnpName: currentTarget.execClient,
          removeAlias: true
        }).catch(e =>
          logs.error(
            "Error removing fullnode.dappnode alias from previous ETH exec client",
            e
          )
        );
    } else {
      const { execClient, consClient } = nextTarget;
      db.ethClientRemote.set(EthClientRemote.off);
      db.executionClientMainnet.set(execClient);
      db.consensusClientMainnet.set(consClient);
      if (sync) await this.changeEthClientSync(execClient, consClient);
      else await this.changeEthClientNotAsync(execClient, consClient);
    }
  }

  /**
   * Handles the Ethereum client fullnode.dappnode alias for the execution client
   * @param dnpName dnp name of the execution client to add/remove the alias from
   * @param removeAlias if true, removes the alias, if false, adds it
   */
  async setDefaultEthClientFullNode({
    dnpName,
    removeAlias
  }: {
    dnpName: ExecutionClientMainnet;
    removeAlias: boolean;
  }): Promise<void> {
    const previousEthClientPackage = await packageGet({
      dnpName
    });

    // Check if ETH client is multiservice, if so get the mainContainer
    const mainService = previousEthClientPackage.manifest?.mainService;
    const serviceName =
      mainService || previousEthClientPackage.containers[0].serviceName;
    // The container selected will be:
    // - Container owner of the main service (if exists)
    // - First container otherwhise
    const previousEthClientContainerName =
      previousEthClientPackage.containers.find(
        container => container.serviceName === serviceName
      )?.containerName || previousEthClientPackage.containers[0].containerName;

    // Remove fullnode alias from endpoint config
    const currentEndpointConfig = await this.getEndpointConfig(
      previousEthClientContainerName
    );
    const endpointConfig: Partial<Dockerode.NetworkInfo> = {
      ...currentEndpointConfig,
      Aliases: [
        ...currentEndpointConfig?.Aliases.filter(
          // according to docs for compose file v3, aliases are declared as strings https://docs.docker.com/compose/compose-file/compose-file-v3/#aliases
          (item: string) => item !== params.FULLNODE_ALIAS
        )
      ]
    };

    if (removeAlias) this.removeFullnodeAliasFromCompose(dnpName, serviceName);
    else this.addFullnodeAliasToCompose(dnpName, serviceName);

    await dockerNetworkDisconnect(
      params.DNP_PRIVATE_NETWORK_NAME,
      previousEthClientContainerName
    );
    await dockerNetworkConnect(
      params.DNP_PRIVATE_NETWORK_NAME,
      previousEthClientContainerName,
      endpointConfig
    );
  }

  /**
   * Changes the ethereum client synchronously
   */
  private async changeEthClientSync(
    execClient: ExecutionClientMainnet,
    consClient: ConsensusClientMainnet
  ): Promise<void> {
    try {
      // Install exec client and set default fullnode alias
      await packageInstall({ name: execClient }).then(
        async () =>
          await this.setDefaultEthClientFullNode({
            dnpName: execClient,
            removeAlias: false
          })
      );
      // Get default cons client user settings and install cons client
      const userSettings = getConsensusUserSettings({ dnpName: consClient });
      await packageInstall({ name: consClient, userSettings });
    } catch (e) {
      throw Error(`Error changing eth client: ${e}`);
    }
  }

  /**
   * Changes the ethereum client asynchronosly by triggering an event
   */
  private async changeEthClientNotAsync(
    execClient: ExecutionClientMainnet,
    consClient: ConsensusClientMainnet
  ): Promise<void> {
    db.ethExecClientInstallStatus.set(execClient, {
      status: "TO_INSTALL"
    });
    db.ethConsClientInstallStatus.set(consClient, {
      status: "TO_INSTALL"
    });
    eventBus.runEthClientInstaller.emit();
  }

  // Utils
  // TODO: put private in the methods and find a way to test them

  /** Get endpoint config for DNP_PRIVATE_NETWORK_NAME */
  async getEndpointConfig(
    containerName: string
  ): Promise<Dockerode.NetworkInfo | null> {
    const inspectInfo = await dockerContainerInspect(containerName);
    return (
      inspectInfo.NetworkSettings.Networks[params.DNP_PRIVATE_NETWORK_NAME] ??
      null
    );
  }

  removeFullnodeAliasFromCompose(
    ethClientDnpName: string,
    ethClientServiceName: string
  ): void {
    this.editComposeFullnodeAliasEthClient(
      true,
      ethClientDnpName,
      ethClientServiceName
    );
  }

  addFullnodeAliasToCompose(
    ethClientDnpName: string,
    ethClientServiceName: string
  ): void {
    this.editComposeFullnodeAliasEthClient(
      false,
      ethClientDnpName,
      ethClientServiceName
    );
  }

  editComposeFullnodeAliasEthClient(
    removeAlias: boolean,
    ethClientDnpName: string,
    ethClientServiceName: string
  ): void {
    const compose = new ComposeFileEditor(ethClientDnpName, false);

    const composeService = compose.services()[ethClientServiceName];
    const serviceNetworks = parseServiceNetworks(
      composeService.get().networks || {}
    );
    const serviceNetwork =
      serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME] ?? null;

    if (removeAlias)
      composeService.removeNetworkAliases(
        params.DNP_PRIVATE_NETWORK_NAME,
        [params.FULLNODE_ALIAS],
        serviceNetwork
      );
    else
      composeService.addNetworkAliases(
        params.DNP_PRIVATE_NETWORK_NAME,
        [params.FULLNODE_ALIAS],
        serviceNetwork
      );

    compose.write();
  }
}
