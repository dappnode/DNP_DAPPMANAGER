import {
  docker,
  dockerComposeUp,
  disconnectConflictingContainerIfAny,
} from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";
import { getDockerComposePath } from "@dappnode/utils";
import Dockerode from "dockerode";

async function disconnectConflictingContainerAndStartBind(): Promise<void> {
  const network = docker.getNetwork(params.DOCKER_PRIVATE_NETWORK_NAME);
  const conflictingContainer = await disconnectConflictingContainerIfAny(
    network,
    params.BIND_IP
  );
  logs.info(`Starting ${params.bindContainerName} container`);
  // The docker compose will start the container with the right IP
  await dockerComposeUp(getDockerComposePath(params.bindDnpName, true), {
    forceRecreate: true,
  });
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
  try {
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
  } catch (e) {
    // check if container does not exist 404
    if (e.statusCode === 404) {
      logs.warn(
        `container ${params.bindContainerName} not found and it might be in an intermedium state`
      );
      // the container might be in intermedium state with different name
      // TODO: what if there is a docker container already using this IP.
      // This would be extremley dangerous once the migration to the private ip range is done
      // and less ips are available.
      logs.info(
        `recreating container ${params.bindContainerName} with compose up`
      );
      await dockerComposeUp(getDockerComposePath(params.bindDnpName, true), {
        forceRecreate: true,
      });
    } else throw e;
  }
}
