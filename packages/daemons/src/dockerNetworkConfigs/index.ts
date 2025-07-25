import { logs } from "@dappnode/logger";
import { createDockerNetwork } from "./createDockerNetwork.js";
import { packagesGet } from "@dappnode/installer";
import { dockerComposeUpPackage } from "@dappnode/dockerapi";
import { writeDockerNetworkConfig } from "./writeDockerNetworkConfig.js";
import { params } from "@dappnode/params";
import { connectPkgContainers } from "./connectPkgContainers.js";
import { InstalledPackageDataApiReturn } from "@dappnode/types";
import { httpsPortal } from "@dappnode/httpsportal";
import { runAtMostEvery } from "@dappnode/utils";
import { createStakerNetworkAndConnectStakerPkgs } from "./createStakerNetworkAndConnectStakerPkgs.js";
import { Consensus, Execution, MevBoost, Signer } from "@dappnode/stakers";

async function ensureDockerNetworkConfigs(
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost
): Promise<void> {
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
      bindIp: params.BIND_NEW_IP
    }
  ];

  for (const config of networksConfigs) {
    logs.info(`Ensuring docker network config for ${config.networkName}`);
    await ensureDockerNetworkConfig(config).catch((error) =>
      logs.error(`Failed to ensure docker network config: ${error.message}`)
    );

    // Create PWA mapping
    // Ensure the PWA mapping is added only for the new network
    // This is needed for the new dappmanager to work with the PWA
    // It will be a internal mapping so its not exposed to the internet
    if (config.networkName === params.DOCKER_PRIVATE_NETWORK_NEW_NAME)
      await httpsPortal
        .addPwaMappingIfNotExists()
        .catch((error) => logs.error(`Failed to add PWA mapping: ${error.message}`));
  }

  await createStakerNetworkAndConnectStakerPkgs(execution, consensus, signer, mevBoost);
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
async function ensureDockerNetworkConfig({
  networkName,
  subnet,
  dappmanagerIp,
  bindIp
}: {
  networkName: string;
  subnet: string;
  dappmanagerIp: string;
  bindIp: string;
}): Promise<void> {
  // 1. create the new docker network
  await createDockerNetwork({
    networkName,
    subnet
  });

  const packages = await packagesGet();
  for (const pkg of setDappmanagerAndBindFirst(packages)) {
    try {
      // 2. write the config in the compose file if needed
      writeDockerNetworkConfig({
        pkg,
        networkName
      });
      // 3. compose up --no-recreate
      if (pkg.dnpName !== params.dappmanagerDnpName)
        await dockerComposeUpPackage({
          composeArgs: { dnpName: pkg.dnpName },
          upAll: false,
          dockerComposeUpOptions: { noRecreate: true }
        }).catch((error) =>
          logs.error(`Failed to run docker compose up --no-recreate for package ${pkg.dnpName}: ${error.message}`)
        );

      // 4. connect container to the network
      await connectPkgContainers({ pkg, networkName, dappmanagerIp, bindIp });
    } catch (error) {
      logs.error(`Failed to ensure docker network config for package ${pkg.dnpName}: ${error.message}`);
      // TODO: consider setting array of failed packages that could not connect to the network and consider executing docker compose up with --force-recreate
      continue;
    }
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

export function startDockerNetworkConfigsDaemon(
  signal: AbortSignal,
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost
): void {
  runAtMostEvery(() => ensureDockerNetworkConfigs(execution, consensus, signer, mevBoost), 1000 * 60 * 30, signal); // every 30 min
}
