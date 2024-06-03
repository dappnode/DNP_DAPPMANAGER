import { docker } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { Execution, Consensus } from "@dappnode/stakers";
import { Network } from "@dappnode/types";

/**
 * Creates the staker network and connects the staker packages to it
 */
export async function createStakerNetworkAndConnectStakerPkgs(
  execution: Execution,
  consensus: Consensus
): Promise<void> {
  await createDockerStakerNetwork();
  for (const network of Object.values(Network)) {
    await Promise.all([
      await execution.persistSelectedExecutionIfInstalled(network),
      await consensus.persistSelectedConsensusIfInstalled(network),
    ]);
  }
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
      logs.info(
        `docker network ${params.DOCKER_STAKER_NETWORK_NAME} not found, creating it`
      );
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
