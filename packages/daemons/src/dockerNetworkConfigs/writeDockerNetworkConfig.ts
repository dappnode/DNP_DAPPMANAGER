import { ComposeFileEditor, ComposeServiceEditor } from "@dappnode/dockercompose";
import { logs } from "@dappnode/logger";
import { InstalledPackageDataApiReturn, ComposeServiceNetwork, ComposeNetworks } from "@dappnode/types";
import { getIsMonoService, getPrivateNetworkAliases } from "@dappnode/utils";

export function writeDockerNetworkConfig({
  pkg,
  networkName,
  rollback = false
}: {
  pkg: InstalledPackageDataApiReturn;
  networkName: string;
  rollback?: boolean; // if true it will remove the network instead of adding it
}): void {
  const compose = new ComposeFileEditor(pkg.dnpName, pkg.isCore);
  if (rollback) {
    logs.info(
      `Rolling back docker compose network configuration for ${pkg.dnpName} compose file, removing network ${networkName}...`
    );
    // Remove network from all services
    const composeServices = compose.services();
    for (const [, serviceEditor] of Object.entries(composeServices)) {
      serviceEditor.removeNetwork(networkName);
    }
    // Remove top-level network entry
    if (compose.compose.networks && compose.compose.networks[networkName]) {
      delete compose.compose.networks[networkName];
    }
    // Persist changes
    compose.write();
    return;
  }

  const composeNetwork = compose.getComposeNetwork(networkName);
  if (!composeNetwork) {
    logs.info(`No network found in ${pkg.dnpName} compose file for ${networkName}, adding it...`);
    addDockerNetworkToCompose({
      compose,
      networkName
    });
  }

  const mainService = pkg.containers.find((c) => c.isMain);
  const composeServices = compose.services();
  for (const [serviceName, serviceEditor] of Object.entries(composeServices)) {
    ensureServiceNetworkConfig({
      dnpName: pkg.dnpName,
      isMainOrMonoservice: getIsMonoService(compose.compose) || mainService?.serviceName === serviceName,
      serviceName,
      serviceEditor,
      networkName
    });
  }

  compose.write();
}

/**
 * Ensures that the service in the compose file has the correct network configuration.
 * If the network is not defined, it will add it with the correct aliases.
 * If the network is defined but missing aliases, it will add the missing aliases.
 * If the network is defined as an array, it will log a warning and skip the configuration.
 *
 * @param dnpName - The name of the DAppNode package.
 * @param isMainOrMonoservice - Whether the service is a main or monoservice.
 * @param serviceName - The name of the service to ensure network configuration for.
 * @param serviceEditor - The editor for the compose service.
 * @param networkName - The name of the network to ensure configuration for.
 */
function ensureServiceNetworkConfig({
  dnpName,
  isMainOrMonoservice,
  serviceName,
  serviceEditor,
  networkName
}: {
  dnpName: string;
  isMainOrMonoservice: boolean;
  serviceName: string;
  serviceEditor: ComposeServiceEditor;
  networkName: string;
}): void {
  const service = serviceEditor.get();
  const serviceNetworks = service.networks || {};

  if (Array.isArray(serviceNetworks)) {
    logs.warn(
      `Service ${serviceName} in ${dnpName} compose file has networks defined as an array, skipping network configuration`
    );
    return;
  }

  const aliases = getPrivateNetworkAliases({ dnpName, serviceName, isMainOrMonoservice }, networkName);
  const serviceNetwork = serviceNetworks[networkName];

  if (!serviceNetwork) {
    logs.info(`No network ${networkName} found in ${dnpName} compose file for service ${serviceName}, adding it...`);
    const newNetwork: ComposeServiceNetwork = {
      aliases
    };
    serviceEditor.addNetwork(networkName, newNetwork);
  } else {
    // check if serviceNetwork has all the aliases
    const missingAliases = aliases.filter((alias) => !serviceNetwork.aliases?.includes(alias));
    if (missingAliases.length > 0) {
      logs.info(
        `Service ${serviceName} in ${dnpName} compose file is missing aliases for network ${networkName}: ${missingAliases.join(", ")}, adding them...`
      );
      serviceEditor.addNetworkAliases(networkName, missingAliases, serviceNetwork);
    }
  }
}

/**
 * Adds a Docker network to the compose file with the specified name and subnet.
 *
 * @param compose - The ComposeFileEditor instance to modify.
 * @param networkName - The name of the Docker network to add.
 * @param subnet - The subnet for the Docker network in CIDR notation.
 */
function addDockerNetworkToCompose({
  compose,
  networkName
}: {
  compose: ComposeFileEditor;
  networkName: string;
}): void {
  const networkConfig: ComposeNetworks = {
    [networkName]: {
      external: true
    }
  };

  compose.compose.networks = {
    ...compose.compose.networks,
    ...networkConfig
  };
}
