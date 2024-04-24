import {
  docker,
  listPackageNoThrow,
  dockerNetworkConnectNotThrow,
} from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { getStakerConfigByNetwork } from "@dappnode/stakers";
import { networks, PackageContainer } from "@dappnode/types";
import Dockerode from "dockerode";
import { ComposeFileEditor } from "@dappnode/dockercompose";

/**
 * Creates the staker network and connects the staker packages to it
 */
export async function createStakerNetworkAndConnectStakerPkgs(): Promise<void> {
  const stakerNetwork = docker.getNetwork(params.DOCKER_STAKER_NETWORK_NAME);
  await createDockerStakerNetwork(stakerNetwork);
  await ensureStakerPkgsNetworkConfig(stakerNetwork);
}

/**
 * Creates the docker staker network
 */
async function createDockerStakerNetwork(
  stakerNetwork: Dockerode.Network
): Promise<void> {
  try {
    await stakerNetwork.inspect();
    logs.info(`docker network ${params.DOCKER_STAKER_NETWORK_NAME} exists`);
  } catch (e) {
    if (e.statusCode === 404) {
      logs.info(`Creating docker network ${params.DOCKER_STAKER_NETWORK_NAME}`);
      await docker.createNetwork({
        Name: params.DOCKER_STAKER_NETWORK_NAME,
        Driver: "bridge",
        IPAM: {
          Driver: "default",
        },
      });
    } else {
      logs.error(
        `Failed to create docker network ${params.DOCKER_STAKER_NETWORK_NAME}`
      );
      throw e;
    }
  }
}

/**
 * Ensure the following staker configuration:
 * - Add the staker network and its fullndoe alias to the docker-compose file to the execution client
 * - Connect the execution and consensus pkgs to the staker network
 *
 * For the following staker pkgs from every network:
 * - **selected** execution client
 * - **selected** consensus client
 */
async function ensureStakerPkgsNetworkConfig(
  stakerNetwork: Dockerode.Network
): Promise<void> {
  for (const network of networks) {
    const stakerConfig = getStakerConfigByNetwork(network);

    if (stakerConfig.executionClient) {
      // Get execution fullnode alias for the staker network
      const alias = getStakerFullnodeAlias(
        stakerConfig.executionClient,
        network
      );
      const executionPkg = await listPackageNoThrow({
        dnpName: stakerConfig.executionClient,
      });
      if (executionPkg) {
        // Add staker network and fullnode alias to execution compose file
        await connectPkgToStakerNetwork(
          stakerNetwork,
          executionPkg.containers,
          alias
        );
        // Connect execution pkg to staker network
        await addStakerNetworkToCompose(stakerConfig.executionClient, alias);
      }
    }

    // Connect consensus to staker network
    if (stakerConfig.consensusClient) {
      const consensusPkg = await listPackageNoThrow({
        dnpName: stakerConfig.consensusClient,
      });
      if (consensusPkg)
        await connectPkgToStakerNetwork(stakerNetwork, consensusPkg.containers);
    }
  }
}

/**
 * Adds the staker network and its fullnode alias to the docker-compose file
 */
async function addStakerNetworkToCompose(
  dnpName: string,
  alias: string
): Promise<void> {
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
      composeService.services()[serviceName].addNetwork(
        params.DOCKER_STAKER_NETWORK_NAME,
        {
          aliases: [alias],
        },
        {
          external: true,
        }
      );
      composeService.write();
    }
  }
}

/**
 * Connects the staker pkg to the staker network with the fullnode alias
 */
async function connectPkgToStakerNetwork(
  stakerNetwork: Dockerode.Network,
  pkgContainers: PackageContainer[],
  alias?: string
): Promise<void> {
  for (const container of pkgContainers)
    await dockerNetworkConnectNotThrow(stakerNetwork, container.containerName, {
      Aliases: alias ? [alias] : [],
    });
}

/**
 * Returns the execution fullnode alias for the staker network
 * i.e for a dnpName="geth.dnp.dappnode.eth" and network "mainnet" it should return "geth.staker.dappnode"
 * @param dnpName "geth.dnp.dappnode.eth"
 * @param network "mainnet"
 */
function getStakerFullnodeAlias(dnpName: string, network: string): string {
  // remove from dnpName the "dnp" | "public" and the "eth"
  dnpName = dnpName.replace(/\.dnp|\.public|\.eth/g, "");
  return `${dnpName}.staker.${network}`;
}
