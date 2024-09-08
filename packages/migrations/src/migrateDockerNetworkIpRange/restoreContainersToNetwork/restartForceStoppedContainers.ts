import { docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { excludeDappmanagerAndBind } from "./excludeDappmanagerAndBind.js";

export async function restartForceStoppedContainers(containersToRestart: string[]): Promise<void> {
  if (containersToRestart.length > 0) {
    logs.info(`Restarting docker containers that require to be restarted: ${containersToRestart}`);

    await Promise.all(
      excludeDappmanagerAndBind(containersToRestart).map(async (cn) => {
        await docker.getContainer(cn).restart();
      })
    );
  }
}
