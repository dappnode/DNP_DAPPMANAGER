import { docker, dockerComposeUp } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { excludeDappmanagerAndBind } from "./excludeDappmanagerAndBind.js";

export async function recreateForceRemovedContainers(containersToRecreate: string[]): Promise<void> {
  if (containersToRecreate.length > 0) {
    logs.info(`Recreating docker containers that require to be recreated: ${containersToRecreate}`);
    const composeFilesPathsToRecreate = (
      await Promise.all(
        excludeDappmanagerAndBind(containersToRecreate).map(async (cn) => {
          // get the compose file path
          return (await docker.getContainer(cn).inspect()).Config.Labels["com.docker.compose.project.config_files"];
        })
      )
    ).filter((path, index, self) => {
      // filter out duplicates
      return self.indexOf(path) === index;
    });

    await Promise.all(composeFilesPathsToRecreate.map(async (dcPath) => await dockerComposeUp(dcPath)));
  }
}
