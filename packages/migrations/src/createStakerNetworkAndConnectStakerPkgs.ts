import { docker } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { ensureStakerPkgsNetworkConfig } from "@dappnode/stakers";
import { DockerStakerNetworkAction } from "@dappnode/types";

/**
 * Creates the staker network and connects the staker packages to it
 */
export async function createStakerNetworkAndConnectStakerPkgs(): Promise<void> {
  await createDockerStakerNetwork();
  await ensureStakerPkgsNetworkConfig(DockerStakerNetworkAction.ADD);
}

/**
 * Creates the docker staker network
 */
async function createDockerStakerNetwork(): Promise<void> {
  try {
    const stakerNetwork = docker.getNetwork(params.DOCKER_STAKER_NETWORK_NAME);
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
