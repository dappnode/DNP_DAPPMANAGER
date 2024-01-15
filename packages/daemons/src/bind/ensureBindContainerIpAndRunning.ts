import {
  docker,
  findContainerByIP,
  dockerComposeUp,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { getDockerComposePath } from "@dappnode/utils";
import Dockerode from "dockerode";

async function disconnectConflictingContainerAndStartBind(): Promise<void> {
  const network = docker.getNetwork(params.DOCKER_PRIVATE_NETWORK_NAME);
  const conflictingContainer = await findContainerByIP(network, params.BIND_IP);
  if (conflictingContainer) {
    logs.info(
      `address ${params.BIND_IP} already in used by ${conflictingContainer.Name}, freeing it`
    );
    await network.disconnect({ Container: conflictingContainer.Name });
  }
  logs.info(`Starting ${params.bindContainerName} container`);
  // The docker compose will start the container with the right IP
  await dockerComposeUp(getDockerComposePath(params.bindDnpName, true));
  // connect back the conflicting container to the network
  if (conflictingContainer) {
    logs.info(
      `Connecting back ${conflictingContainer.Name} container to ${params.DOCKER_PRIVATE_NETWORK_NAME} network`
    );
    await network.connect({
      Container: conflictingContainer.Name,
    });
  }
}

export async function ensureBindContainerIpAndRunning(): Promise<void> {
  const isBindRunning = (
    await docker.getContainer(params.bindContainerName).inspect()
  ).State.Running;

  // check if the bind container is running
  if (!isBindRunning) {
    logs.info(`${params.bindContainerName} container is not running`);
    await disconnectConflictingContainerAndStartBind();
  } else {
    // check is connected to dncore_network
    const isConnectedToNetwork = Object.values(
      (
        (await docker
          .getNetwork(params.DOCKER_PRIVATE_NETWORK_NAME)
          .inspect()) as Dockerode.NetworkInspectInfo
      ).Containers ?? []
    ).some((container) => container.Name === params.bindContainerName);

    if (!isConnectedToNetwork) {
      logs.info(
        `${params.bindContainerName} container is not connected to ${params.DOCKER_PRIVATE_NETWORK_NAME} network`
      );
      await disconnectConflictingContainerAndStartBind();
    } else {
      // check it has the right IP
      const hasRightIp =
        (await docker.getContainer(params.bindContainerName).inspect())
          .NetworkSettings.Networks[params.DOCKER_PRIVATE_NETWORK_NAME]
          .IPAddress === params.BIND_IP;
      if (hasRightIp) {
        logs.info(`${params.bindContainerName} container has right IP`);
      } else {
        logs.info(`${params.bindContainerName} container has wrong IP`);
        await disconnectConflictingContainerAndStartBind();
      }
    }
  }
}
