import { docker, listPackageNoThrow } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import {
  getStakerConfigByNetwork,
  getStakerDnpNamesByNetwork,
} from "@dappnode/stakers";
import { networks } from "@dappnode/types";
import Dockerode, { Network } from "dockerode";
import {
  ComposeFileEditor,
  ComposeServiceEditor,
} from "@dappnode/dockercompose";

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
 * - Add the staker network and its fullndoe alias to the docker-compose file
 * - Connect the staker pkg to the staker network
 *
 * For the following staker pkgs from every network:
 * - web3signer
 * - mev boost
 * - **selected** execution client
 * - **selected** consensus client
 */
async function ensureStakerPkgsNetworkConfig(
  stakerNetwork: Dockerode.Network
): Promise<void> {
  for (const network of networks) {
    const stakerConfig = getStakerConfigByNetwork(network);

    for (const dnpName of [
      stakerConfig.executionClient,
      stakerConfig.consensusClient,
    ]) {
      if (dnpName && (await listPackageNoThrow({ dnpName }))) {
        await addStakerNetworkToCompose(dnpName, network);
        await connectPkgToStakerNetwork(stakerNetwork, dnpName);
      }
    }
  }
}

function getFullnodeAlias(network: Network): string {}

/**
 * Adds the staker network and its fullnode alias to the docker-compose file
 */
async function addStakerNetworkToCompose(
  dnpName: string,
  network: Network,
  aliases?: string[]
): Promise<void> {
  // compose network
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
  // compose service network
  // iterate over compose services
  for (const [serviceName, service] of Object.entries(
    compose.compose.services
  )) {
    const composeService = new ComposeFileEditor(dnpName, false);
    if (Array.isArray(service.networks)) continue;

    const stakerServiceNetwork =
      service.networks?.[params.DOCKER_STAKER_NETWORK_NAME];
    if (!stakerServiceNetwork) {
      service.networks = {
        ...service.networks,
        [params.DOCKER_STAKER_NETWORK_NAME]: {
          external: true,
          aliases: getFullnodeAlias(network),
        },
      };
      compose.write();
    }
  }
}

/**
 * Connects the staker pkg to the staker network with the fullnode alias
 */
async function connectPkgToStakerNetwork(
  stakerNetwork: Dockerode.Network,
  dnpName: string
): Promise<void> {}
