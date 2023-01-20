import { cleanRepos } from "../../testUtils.js";
import shell from "../../../src/utils/shell.js";

export async function cleanInstallationArtifacts(
  partialContainerName: string
): Promise<void> {
  await cleanRepos();
  const containersToKill = await shell(
    `docker ps -f name=${partialContainerName} -aq`
  );

  // Kill one by one. Otherwise if container 1 errors, the rest won't be deleted
  for (const containerToKill of containersToKill.trim().split(/\s+/))
    if (containerToKill)
      await shell(`docker rm -v -f ${containerToKill}`).catch(e => {
        console.warn(`Error cleaning container ${containerToKill}`, e);
      });
}
