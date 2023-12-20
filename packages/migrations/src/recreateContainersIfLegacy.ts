import { logs } from "@dappnode/logger";
import { listPackages, docker, dockerComposeUp } from "@dappnode/dockerapi";
import { getDockerComposePath } from "@dappnode/utils";

/**
 * Recreate docker containers if legacy dns is still set in runtime.
 * Skip for dappmanager container to avoid dangerous restart loops
 */
export async function recreateContainersIfLegacyDns(): Promise<void> {
  const legacyDns = "172.33.1.2";

  const pkgs = await listPackages();

  await Promise.all(
    pkgs.map(async (pkg) => {
      const hasLegacyDns = pkg.containers.some(async (c) => {
        try {
          return (
            await docker.getContainer(c.containerName).inspect()
          ).HostConfig.Dns?.includes(legacyDns);
        } catch (e) {
          // continue with migration on error
          logs.error(`Error inspecting container ${c.containerName}: ${e}`);
          return false;
        }
      });

      if (hasLegacyDns) {
        logs.info(`pkg ${pkg.dnpName} has legacy dns, restarting it...`);
        // containers must be recreated
        await dockerComposeUp(getDockerComposePath(pkg.dnpName, pkg.isCore));
      }
    })
  );
}
