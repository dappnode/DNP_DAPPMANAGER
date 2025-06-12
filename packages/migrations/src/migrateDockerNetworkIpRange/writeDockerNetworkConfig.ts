import { ComposeFileEditor, ComposeServiceEditor } from "@dappnode/dockercompose";
import { logs } from "@dappnode/logger";
import { InstalledPackageDataApiReturn, ComposeServiceNetwork, ComposeNetworks } from "@dappnode/types";
import { getIsMonoService, getPrivateNetworkAliases } from "@dappnode/utils";

export function writeDockerNetworkConfig({
  pkg,
  networkName,
  subnet
}: {
  pkg: InstalledPackageDataApiReturn;
  networkName: string;
  subnet: string;
}): void {
  const compose = new ComposeFileEditor(pkg.dnpName, pkg.isCore);
  const composeNetwork = compose.getComposeNetwork(networkName);
  if (!composeNetwork) {
    logs.info(`No network found in ${pkg.dnpName} compose file for ${networkName}`);
    addDockerNetworkToCompose({
      compose,
      networkName,
      subnet
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

  const aliases = getPrivateNetworkAliases({ dnpName, serviceName, isMainOrMonoservice });
  const serviceNetwork = serviceNetworks[networkName];

  if (!serviceNetwork) {
    logs.info(`No network ${networkName} found in ${dnpName} compose file for service ${serviceName}`);
    const newNetwork: ComposeServiceNetwork = {
      aliases
    };
    serviceEditor.addNetwork(networkName, newNetwork);
  } else {
    // check if serviceNetwork has all the aliases
    const missingAliases = aliases.filter((alias) => !serviceNetwork.aliases?.includes(alias));
    if (missingAliases.length > 0) {
      logs.info(
        `Service ${serviceName} in ${dnpName} compose file is missing aliases for network ${networkName}: ${missingAliases.join(", ")}`
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
  networkName,
  subnet
}: {
  compose: ComposeFileEditor;
  networkName: string;
  subnet: string;
}): void {
  const networkConfig: ComposeNetworks = {
    [networkName]: {
      name: networkName,
      external: true,
      driver: "bridge",
      ipam: {
        config: [
          {
            subnet
          }
        ]
      }
    }
  };

  compose.compose.networks = {
    ...compose.compose.networks,
    ...networkConfig
  };

  compose.write();
}
