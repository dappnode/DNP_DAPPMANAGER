import {
  docker,
  dockerNetworkConnectNotThrow,
  dockerNetworkDisconnect,
  listPackageNoThrow,
} from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import {
  networks,
  PackageContainer,
  DockerStakerNetworkAction,
} from "@dappnode/types";
import { getStakerConfigByNetwork } from "../getStakerConfigByNetwork.js";

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
  stakerAction: DockerStakerNetworkAction
): Promise<void> {
  for (const network of networks) {
    const stakerConfig = getStakerConfigByNetwork(network);

    for (const { dnpName, alias } of [
      {
        dnpName: stakerConfig.executionClient,
        alias: getStakerFullnodeAlias(network, stakerConfig.executionClient),
      },
      { dnpName: stakerConfig.consensusClient, alias: null },
    ]) {
      // skip if no client selected
      if (!dnpName) continue;

      const pkg = await listPackageNoThrow({
        dnpName: dnpName,
      });
      // skip if pkg not installed
      if (!pkg) continue;

      // Add staker network and fullnode alias if available to client compose file
      if (stakerAction === DockerStakerNetworkAction.ADD) {
        await connectPkgToStakerNetwork(
          params.DOCKER_STAKER_NETWORK_NAME,
          pkg.containers,
          alias
        );
        // Connect client to staker network
        addStakerNetworkToCompose(dnpName, alias);
      } else {
        // Disconnect client from staker network
        disconnectPkgFromStakerNetwork(
          docker.getNetwork(params.DOCKER_STAKER_NETWORK_NAME),
          pkg.containers
        );
        removeStakerNetworkFromCompose(dnpName);
      }
    }
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

function disconnectPkgFromStakerNetwork(
  stakerNetwork: Dockerode.Network,
  pkgContainers: PackageContainer[]
): void {
  for (const container of pkgContainers)
    dockerNetworkDisconnect(
      params.DOCKER_STAKER_NETWORK_NAME,
      container.containerName
    );
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
  for (const container of pkgContainers)
    await dockerNetworkConnectNotThrow(networkName, container.containerName, {
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
