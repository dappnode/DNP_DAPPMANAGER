import { docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { filterContainers } from "./filterContainers.js";

export async function restartContainersToRestart(
  containersToRestart: string[]
): Promise<void> {
  if (containersToRestart.length > 0) {
    logs.info(
      `Restarting docker containers that require to be restarted: ${containersToRestart}`
    );

    await Promise.all(
      filterContainers(containersToRestart).map(async (cn) => {
        await docker.getContainer(cn).restart();
      })
    );
  }
}
