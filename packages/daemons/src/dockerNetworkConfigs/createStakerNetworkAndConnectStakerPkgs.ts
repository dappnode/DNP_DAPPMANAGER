import { docker } from "@dappnode/dockerapi";
import { params } from "@dappnode/params";
import { logs } from "@dappnode/logger";
import { Execution, Consensus, Signer, MevBoost } from "@dappnode/stakers";
import { L1_NETWORKS } from "@dappnode/types";

/**
 * Creates the staker network and connects the staker packages to it
 * Note: Only L1 networks are handled here. L2 networks have their own setup.
 * TODO: should L2 networks be handled here as well?
 */
export async function createStakerNetworkAndConnectStakerPkgs(
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost
): Promise<void> {
  for (const network of L1_NETWORKS) {
    await createDockerStakerNetwork(params.DOCKER_BLOCKCHAIN_NETWORKS[network]);
    const results = await Promise.allSettled([
      execution.persistSelectedExecutionIfInstalled(network),
      consensus.persistSelectedConsensusIfInstalled(network),
      signer.persistSignerIfInstalledAndRunning(network),
      mevBoost.persistMevBoostIfInstalledAndRunning(network)
    ]);

    const errors = results.filter((result) => result.status === "rejected").map((result) => result.reason);
    if (errors.length > 0) logs.error(`Errors while connecting staker packages to the network ${network}`, errors);
  }
}

/**
 * Creates the docker staker network
 */
async function createDockerStakerNetwork(network: string): Promise<void> {
  try {
    const stakerNetwork = docker.getNetwork(network);
    await stakerNetwork.inspect();
    logs.info(`docker network ${network} exists`);
  } catch (e) {
    if (e.statusCode === 404) {
      logs.info(`docker network ${network} not found, creating it`);
      await docker.createNetwork({
        Name: network,
        Driver: "bridge",
        IPAM: {
          Driver: "default"
        }
      });
    } else {
      logs.error(`Failed to create docker network ${network}`);
      throw e;
    }
  }
}
