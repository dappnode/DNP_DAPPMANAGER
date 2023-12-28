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
): Promise<Dockerode.Network> {
  logs.info(`disconnecting all containers from ${networkToRemove.id}`);
  await disconnectAllContainersFromNetwork(networkToRemove).catch((e) =>
    logs.error(
      `error while disconnecting all containers from the network: ${e.message}`
    )
  );

  await removeConnectedContainersIfAny(networkToRemove).catch((e) =>
    logs.error(
      `error removing pending containers, the docker network removal might fail: ${e}`
    )
  );

  logs.info(`removing docker network ${networkToRemove.id}`);
  await networkToRemove.remove();

  // create network with valid range
  logs.info(
    `creating docker network ${newNetworkOptions.Name} with valid IP range`
  );

  return await docker.createNetwork(newNetworkOptions);
}

/**
 * Kills and removes (remove with flag --force true) docker containers that
 * are connected to a docker network.
 *
 * @param networkToRemove dockerode network to remove
 */
async function removeConnectedContainersIfAny(
  networkToRemove: Dockerode.Network
): Promise<void> {
  const containers = (
    (await networkToRemove.inspect()) as Dockerode.NetworkInspectInfo
  ).Containers;

  if (!isEmpty(containers)) {
    logs.warn(
      `Unable to disconnect all containers from network, removing them`
    );
    await Promise.all(
      Object.values(containers).map(
        async (c) => await docker.getContainer(c.Name).remove({ force: true })
      )
    );
  }
}
