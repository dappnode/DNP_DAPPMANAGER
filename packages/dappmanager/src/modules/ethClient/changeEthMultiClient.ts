import * as db from "../../db";
import { eventBus } from "../../eventBus";
import params from "../../params";
import { packageRemove, packageGet } from "../../calls";
import { Eth2ClientTarget, EthClientRemote } from "../../types";
import { logs } from "../../logs";
import { ComposeFileEditor } from "../compose/editor";
import { parseServiceNetworks } from "../compose/networks";
import {
  dockerNetworkDisconnect,
  dockerNetworkConnect,
  dockerContainerInspect
} from "../docker";
import Dockerode from "dockerode";
import { isEqual } from "lodash";

/**
 * Changes the ethereum client used to fetch package data
 * Callable by the client
 * @param nextTarget Ethereum client to change to
 * @param deletePrevEthClient If set delete previous eth1 client
 */
export async function changeEthMultiClient(
  nextTarget: Eth2ClientTarget,
  deletePrevExecClient?: boolean,
  deletePrevConsClient?: boolean
): Promise<void> {
  const prevTarget: Eth2ClientTarget =
    db.ethClientRemote.get() === EthClientRemote.on
      ? "remote"
      : {
          execClient: db.executionClientMainnet.get(),
          consClient: db.consensusClientMainnet.get()
        };

  if (prevTarget !== "remote" && !isEqual(prevTarget, nextTarget)) {
    // Remove Consensus client
    if (prevTarget.consClient && deletePrevConsClient)
      await packageRemove({ dnpName: prevTarget.consClient }).catch(e =>
        logs.error(
          `Error removing consensus client ${prevTarget.consClient}`,
          e
        )
      );

    // Remove Execution client
    if (prevTarget.execClient && deletePrevExecClient) {
      await packageRemove({ dnpName: prevTarget.execClient }).catch(e =>
        logs.error(
          `Error removing execution client ${prevTarget.consClient}`,
          e
        )
      );
    } else {
      // Remove alias fullnode.dappnode from the eth client if not removed by the user
      await setDefaultEthClientFullNode(true, prevTarget.execClient).catch(e =>
        logs.error(
          "Error removing fullnode.dappnode alias from previous ETH multi-client",
          e
        )
      );
    }
  }

  // Setting the status to selected will trigger an install
  if (nextTarget === "remote") {
    db.ethClientRemote.set(EthClientRemote.on);
  } else {
    db.executionClientMainnet.set(nextTarget.execClient);
    db.consensusClientMainnet.set(nextTarget.consClient);
  }
  if (prevTarget !== nextTarget && nextTarget !== "remote") {
    db.ethExecClientInstallStatus.set(nextTarget.execClient, {
      status: "TO_INSTALL"
    });
    db.ethConsClientInstallStatus.set(nextTarget.consClient, {
      status: "TO_INSTALL"
    });
    eventBus.runEthClientInstaller.emit();
  }
}

// Utils

export async function setDefaultEthClientFullNode(
  removeAlias: boolean,
  dnpName: string
): Promise<void> {
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
  const currentEndpointConfig = await getEndpointConfig(
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

  if (removeAlias) removeFullnodeAliasFromCompose(dnpName, serviceName);
  else addFullnodeAliasToCompose(dnpName, serviceName);

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

export function removeFullnodeAliasFromCompose(
  ethClientDnpName: string,
  ethClientServiceName: string
): void {
  editComposeFullnodeAliasEthClient(
    true,
    ethClientDnpName,
    ethClientServiceName
  );
}

export function addFullnodeAliasToCompose(
  ethClientDnpName: string,
  ethClientServiceName: string
): void {
  editComposeFullnodeAliasEthClient(
    false,
    ethClientDnpName,
    ethClientServiceName
  );
}

/** Get endpoint config for DNP_PRIVATE_NETWORK_NAME */
export async function getEndpointConfig(
  containerName: string
): Promise<Dockerode.NetworkInfo | null> {
  const inspectInfo = await dockerContainerInspect(containerName);
  return (
    inspectInfo.NetworkSettings.Networks[params.DNP_PRIVATE_NETWORK_NAME] ??
    null
  );
}

function editComposeFullnodeAliasEthClient(
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
