import {
  dockerNetworkConnect,
  dockerNetworkDisconnect,
  listPackageNoThrow,
} from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { Network, networks, PackageContainer } from "@dappnode/types";
import { getStakerConfigByNetwork } from "../getStakerConfigByNetwork.js";
import { getStakerDnpNamesByNetwork } from "../get/getStakerDnpNamesByNetwork.js";

/**
 * Ensure the following staker configuration:
 * - Add the staker network and its fullndoe alias to the docker-compose file to the execution client
 * - Connect the execution and consensus pkgs to the staker network
 *
 * For the following staker pkgs from every network:
 * - **selected** execution client
 * - **selected** consensus client
 */
export async function ensureStakerPkgsNetworkConfig(
  network: Network
): Promise<void> {
  const stakerConfig = getStakerConfigByNetwork(network);
  const { executionClients, consensusClients } =
    getStakerDnpNamesByNetwork(network);

  for (const { dnpName, clientsToCheck, alias } of [
    {
      dnpName: stakerConfig.executionClient,
      clientsToCheck: executionClients,
      alias: getStakerFullnodeAlias(network, stakerConfig.executionClient),
    },
    {
      dnpName: stakerConfig.consensusClient,
      clientsToCheck: consensusClients,
      alias: null,
    },
  ]) {
    // skip if no client selected
    if (!dnpName) continue;

    const pkg = await listPackageNoThrow({
      dnpName: dnpName,
    });
    // skip if pkg not installed
    if (!pkg) continue;

    // Disconnect and remove staker network from other clients
    await disconnectAndRemoveStakerNetworkFromCompose(clientsToCheck);

    // Add staker network and fullnode alias if available to client compose file
    await connectPkgToStakerNetwork(
      params.DOCKER_STAKER_NETWORK_NAME,
      pkg.containers,
      alias
    );
    // Connect client to staker network
    addStakerNetworkToCompose(dnpName, alias);
  }
}

async function disconnectAndRemoveStakerNetworkFromCompose(
  clientsToCheck: readonly string[]
): Promise<void> {
  for (const client of clientsToCheck) {
    const clientPkg = await listPackageNoThrow({
      dnpName: client,
    });
    // skip if client not installed
    if (!clientPkg) continue;

    // Disconnect client from staker network
    await disconnectConnectedPkgFromStakerNetwork(
      params.DOCKER_STAKER_NETWORK_NAME,
      clientPkg.containers
    );
    removeStakerNetworkFromCompose(client);
  }
}

function removeStakerNetworkFromCompose(dnpName: string): void {
  // remove from compose network
  const compose = new ComposeFileEditor(dnpName, false);
  delete compose.compose.networks?.[params.DOCKER_STAKER_NETWORK_NAME];
  compose.write();
  // remove from compose service network
  for (const [serviceName, service] of Object.entries(
    compose.compose.services
  )) {
    const composeService = new ComposeFileEditor(dnpName, false);
    // network declared in array format is not supported
    if (Array.isArray(service.networks)) {
      logs.warn(
        `Service ${serviceName} in ${dnpName} has a network declared in array format, skipping`
      );
      continue;
    }
    composeService
      .services()
      // eslint-disable-next-line no-unexpected-multiline
      [serviceName].removeNetwork(params.DOCKER_STAKER_NETWORK_NAME);
    composeService.write();
  }
}

async function disconnectConnectedPkgFromStakerNetwork(
  networkName: string,
  pkgContainers: PackageContainer[]
): Promise<void> {
  const connectedContainers = pkgContainers
    .filter((container) =>
      container.networks.some((network) => network.name === networkName)
    )
    .map((container) => container.containerName);
  for (const container of connectedContainers)
    await dockerNetworkDisconnect(networkName, container);
}

/**
 * Adds the staker network and its fullnode alias to the docker-compose file
 */
function addStakerNetworkToCompose(
  dnpName: string,
  alias?: string | null
): void {
  // add to compose network
  const compose = new ComposeFileEditor(dnpName, false);
  const stakerNetwork =
    compose.compose.networks?.[params.DOCKER_STAKER_NETWORK_NAME];
  if (!stakerNetwork) {
    compose.compose.networks = {
      ...compose.compose.networks,
      [params.DOCKER_STAKER_NETWORK_NAME]: {
        external: true,
      },
    };
    compose.write();
  }
  // add to compose service network
  for (const [serviceName, service] of Object.entries(
    compose.compose.services
  )) {
    const composeService = new ComposeFileEditor(dnpName, false);
    // network declared in array format is not supported
    if (Array.isArray(service.networks)) {
      logs.warn(
        `Service ${serviceName} in ${dnpName} has a network declared in array format, skipping`
      );
      continue;
    }
    const stakerServiceNetwork =
      service.networks?.[params.DOCKER_STAKER_NETWORK_NAME];

    if (!stakerServiceNetwork) {
      composeService
        .services()
        // eslint-disable-next-line no-unexpected-multiline
        [serviceName].addNetwork(params.DOCKER_STAKER_NETWORK_NAME, {
          aliases: alias ? [alias] : [],
        });
      composeService.write();
    }
  }
}

/**
 * Connects the staker pkg to the staker network with the fullnode alias
 */
async function connectPkgToStakerNetwork(
  networkName: string,
  pkgContainers: PackageContainer[],
  alias?: string | null
): Promise<void> {
  const disconnectedContainers = pkgContainers
    .filter(
      (container) =>
        !container.networks.some((network) => network.name === networkName)
    )
    .map((container) => container.containerName);
  for (const container of disconnectedContainers)
    await dockerNetworkConnect(networkName, container, {
      Aliases: alias ? [alias] : [],
    });
}

/**
 * Returns the execution fullnode alias for the staker network
 * i.e for a dnpName="geth.dnp.dappnode.eth" and network "mainnet" it should return "geth.staker.dappnode"
 * @param dnpName "geth.dnp.dappnode.eth"
 * @param network "mainnet"
 */
function getStakerFullnodeAlias(
  network: string,
  dnpName?: string | null
): string | null {
  if (!dnpName) return null;
  // remove from dnpName the "dnp" | "public" and the "eth"
  dnpName = dnpName.replace(/\.dnp|\.dappnode|\.public|\.eth/g, "");
  return `execution.${network}.staker.dappnode`;
}
