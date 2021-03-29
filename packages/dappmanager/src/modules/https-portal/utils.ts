import { PackageContainer } from "../../types";
import { ComposeFileEditor } from "../compose/editor";
import params from "../../params";
import { logs } from "../../logs";

const dncoreNetworkName = params.DNP_PRIVATE_NETWORK_NAME;
const dncoreNetworkNameFromCore = params.DNP_PRIVATE_NETWORK_NAME_FROM_CORE;

export function addNetworkAliasCompose(
  container: PackageContainer,
  networkName: string,
  aliases: string[]
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);
  const composeService = compose.services()[container.serviceName];
  composeService.addNetwork(networkName, { aliases });
  compose.write();
}

export function removeNetworkAliasCompose(
  container: PackageContainer,
  networkName: string
): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);
  const composeService = compose.services()[container.serviceName];
  composeService.removeNetwork(networkName);
  compose.write();
}

/**
 * Get compose file network and compose network settings from dncore_network
 * And rewrites the compose with the core network edited
 */
export function migrateCoreNetworkInCompose(container: PackageContainer): void {
  const compose = new ComposeFileEditor(container.dnpName, container.isCore);

  // 0. Check if network migration has been done
  const composeNetwork = compose.getComposeNetwork(
    params.DNP_PRIVATE_NETWORK_NAME
  );
  if (
    composeNetwork?.name === params.DNP_PRIVATE_NETWORK_NAME &&
    composeNetwork?.external
  ) {
    logs.info(`Network migration already done on ${container.containerName}`);
  } else {
    // 1. compose network settings: not needed since will be declared as external
    /* const networkConfig = compose.getComposeNetwork(dncoreNetworkNameFromCore);
  if (!networkConfig) return; */

    // 2. compose service network settings
    const composeService = compose.services()[container.serviceName];
    const serviceNetworks = composeService.get().networks;
    // core network should be defined as object not array
    if (Array.isArray(serviceNetworks)) return;
    const serviceNetwork = serviceNetworks?.[dncoreNetworkNameFromCore];
    if (!serviceNetwork) return;

    // 3. Ensure compose file version 3.5
    compose.compose = {
      ...compose.compose,
      version: params.MINIMUM_COMPOSE_VERSION
    };

    // 4. core network migration: network => dncore_network
    composeService.removeNetwork(dncoreNetworkNameFromCore);
    composeService.addNetwork(
      dncoreNetworkName,
      serviceNetwork,
      { external: true, name: dncoreNetworkName } //...networkConfig,
    );

    compose.write();
    logs.info(`Added external network on ${container.containerName}`);
  }
}
