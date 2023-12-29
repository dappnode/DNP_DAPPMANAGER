import {
  disconnectAllContainersFromNetwork,
  docker,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import Dockerode from "dockerode";
import { isEmpty } from "lodash-es";

/**
 * Recreates the docker network with the configuration defined in networkOptions:
 *
 * 1. Disconnect al docker containers from a docker network
 * 2. Remove the docker network
 * 3. Creates again the docker network with the config
 *
 * @param networkToRemove dockerode network to remove
 * @param newNetworkOptions dockerorde create options object
 */
export async function recreateDockerNetwork(
  networkToRemove: Dockerode.Network,
  newNetworkOptions: Dockerode.NetworkCreateOptions
): Promise<{
  network: Dockerode.Network;
  containersToRestart: string[];
  containersToRecreate: string[];
}> {
  const { containersToRestart, containersToRecreate } =
    await cleanDockerNetworkBeforeRemoval(networkToRemove);

  logs.info(`removing docker network ${networkToRemove.id}`);
  // CRITICAL: if this step fails migration failure
  await networkToRemove.remove();

  // create network with valid range
  logs.info(
    `creating docker network ${newNetworkOptions.Name} with valid IP range`
  );
  // CRITICAL: if this step fails migration failure
  return {
    network: await docker.createNetwork(newNetworkOptions),
    containersToRestart,
    containersToRecreate,
  };
}

async function cleanDockerNetworkBeforeRemoval(
  networkToRemove: Dockerode.Network
): Promise<{ containersToRestart: string[]; containersToRecreate: string[] }> {
  const containers = (
    (await networkToRemove.inspect()) as Dockerode.NetworkInspectInfo
  ).Containers;

  if (containers && !isEmpty(containers)) {
    logs.info(
      `disconnecting containers from docker network before removing it`
    );
    await disconnectAllContainersFromNetwork(networkToRemove).catch((e) =>
      logs.error(
        `error while disconnecting all containers from the network: ${e.message}`
      )
    );

    return {
      containersToRestart: await stopConnectedContainersIfAny(
        networkToRemove
      ).catch((e) => {
        logs.error(`error stopping pending connected containers: ${e.message}`);
        return [];
      }),
      containersToRecreate: await removeConnectedContainersIfAny(
        networkToRemove
      ).catch((e) => {
        logs.error(
          `error removing pending containers, the docker network removal might fail!: ${e}`
        );
        return [];
      }),
    };
  }
  return {
    containersToRecreate: [],
    containersToRestart: [],
  };
}

/**
 * Stops connected containers if any to the docker network
 *
 * @param networkToRemove dockerode network to remove
 */
async function stopConnectedContainersIfAny(
  networkToRemove: Dockerode.Network
): Promise<string[]> {
  const containers = (
    (await networkToRemove.inspect()) as Dockerode.NetworkInspectInfo
  ).Containers;

  if (!isEmpty(containers)) {
    const containersNames = Object.values(containers).map((c) => c.Name);
    await Promise.all(
      containersNames.map(async (cn) => await docker.getContainer(cn).stop())
    );
    return containersNames;
  }
  return [];
}

/**
 * Kills and removes (remove with flag --force true) docker containers that
 * are connected to a docker network.
 *
 * @param networkToRemove dockerode network to remove
 */
async function removeConnectedContainersIfAny(
  networkToRemove: Dockerode.Network
): Promise<string[]> {
  const containers = (
    (await networkToRemove.inspect()) as Dockerode.NetworkInspectInfo
  ).Containers;

  if (!isEmpty(containers)) {
    const containersNames = Object.values(containers).map((c) => c.Name);
    await Promise.all(
      containersNames.map(
        async (cn) => await docker.getContainer(cn).remove({ force: true })
      )
    );
    return containersNames;
  }
  return [];
}
