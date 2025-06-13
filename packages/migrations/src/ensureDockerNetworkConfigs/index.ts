import { logs } from "@dappnode/logger";
import { createDockerNetwork } from "./createDockerNetwork.js";
import { packagesGet } from "@dappnode/installer";
import { dockerComposeUpPackage, disconnectAllContainersFromNetwork, docker } from "@dappnode/dockerapi";
import { writeDockerNetworkConfig } from "./writeDockerNetworkConfig.js";
import { params } from "@dappnode/params";
import { connectPkgContainers } from "./connectPkgContainers.js";
import { InstalledPackageDataApiReturn } from "@dappnode/types";

export async function ensureDockerNetworkConfigs(rollback = false): Promise<void> {
  const networksConfigs = [
    {
      networkName: params.DOCKER_PRIVATE_NETWORK_NAME,
      subnet: params.DOCKER_NETWORK_SUBNET,
      dappmanagerIp: params.DAPPMANAGER_IP,
      bindIp: params.BIND_IP
    },
    {
      networkName: params.DOCKER_PRIVATE_NETWORK_NEW_NAME,
      subnet: params.DOCKER_NETWORK_NEW_SUBNET,
      dappmanagerIp: params.DAPPMANAGER_NEW_IP,
      bindIp: params.BIND_NEW_IP,
      rollback // only apply rollback to dnprivate_network
    }
  ];

  for (const config of networksConfigs) {
    try {
      logs.info(`Ensuring docker network config for ${config.networkName}`);
      await ensureDockerNetworkConfig(config);
    } catch (error) {
      logs.error(`Failed to ensure docker network config for ${config.networkName}: ${error.message}`);
    }
  }
}

/**
 * Ensures the docker network defined has the following config:
 * - docker network name: "dncore_network"
 * - docker network subnet: "172.33.0.0/16"
 * - dappmanager container has assigned ip: "172.33.1.7"
 * - bind container has assigned ip: "172.33.1.2"
 * - All docker containers prefixed with "DAppnNodeCore-" || "DAppnodePackage-" are connected to it
 * - dappmanager and bind
 */
export async function ensureDockerNetworkConfig({
  networkName,
  subnet,
  dappmanagerIp,
  bindIp,
  rollback = false
}: {
  networkName: string;
  subnet: string;
  dappmanagerIp: string;
  bindIp: string;
  rollback?: boolean; // if true it will remove the
}): Promise<void> {
  // consider calling packagges get every time to ensure we have the latest packages
  const packages = await packagesGet();

  if (rollback) {
    const network = docker.getNetwork(networkName);
    logs.info(`Rolling back docker network configuration for ${networkName}...`);

    // 1. Disconnect containers from the network
    await disconnectAllContainersFromNetwork(network);

    for (const pkg of packages) {
      logs.info(
        `Rolling back docker network configuration for ${pkg.dnpName} compose file, disconnecting containers...`
      );

      // 2. Remove the config from the compose file if needed
      writeDockerNetworkConfig({
        pkg,
        networkName,
        rollback: true
      });
      // 3. Compose up --no-recreate
      await dockerComposeUpPackage({
        composeArgs: { dnpName: pkg.dnpName },
        upAll: true,
        dockerComposeUpOptions: { noRecreate: true }
      }).catch((error) =>
        logs.error(`Failed to run docker compose up --no-recreate for package ${pkg.dnpName}: ${error.message}`)
      );
    }

    // 4. remove the docker network
    await network.remove();

    return;
  }

  // 1. create the new docker network
  const network = await createDockerNetwork({
    networkName,
    subnet
  });

  for (const pkg of setDappmanagerAndBindFirst(packages)) {
    // 2. write the config in the compose file if needed
    writeDockerNetworkConfig({
      pkg,
      networkName
    });
    // 3. compose up --no-recreate
    await dockerComposeUpPackage({
      composeArgs: { dnpName: pkg.dnpName },
      upAll: true,
      dockerComposeUpOptions: { noRecreate: true }
    }).catch((error) =>
      logs.error(`Failed to run docker compose up --no-recreate for package ${pkg.dnpName}: ${error.message}`)
    );

    // 4. connect container to the network
    await connectPkgContainers({ pkg, network, dappmanagerIp, bindIp });
  }
}

function setDappmanagerAndBindFirst(packages: InstalledPackageDataApiReturn[]): InstalledPackageDataApiReturn[] {
  return packages.sort((a, b) => {
    if (a.dnpName === params.bindContainerName) return -1; // bind should be first
    if (b.dnpName === params.bindContainerName) return 1; // bind should be first
    if (a.dnpName === params.dappmanagerContainerName) return 1; // dappmanager should be second
    if (b.dnpName === params.dappmanagerContainerName) return -1; // dappmanager should be second
    return 0; // rest can be in any order
  });
}
