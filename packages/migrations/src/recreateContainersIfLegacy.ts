import { logs } from "@dappnode/logger";
import { listPackages, docker, dockerComposeUp } from "@dappnode/dockerapi";
import { getDockerComposePath } from "@dappnode/utils";
import { params } from "@dappnode/params";

/**
 * Recreate docker containers if legacy dns is still set in runtime.
 * Skip for dappmanager container to avoid dangerous restart loops
 */
export async function recreateContainersIfLegacyDns(): Promise<void> {
  const pkgs = await listPackages();

  await Promise.all(
    pkgs.map(async (pkg) => {
      const hasLegacyDns = pkg.containers.some(async (c) => {
        try {
          const dns = (await docker.getContainer(c.containerName).inspect())
            .HostConfig.Dns;
          if (dns && dns.includes(params.DOCKER_LEGACY_DNS)) return true;
          return false;
        } catch (e) {
          // continue with migration on error
          logs.error(`Error inspecting container ${c.containerName}: ${e}`);
          return false;
        }
      });

      if (hasLegacyDns) {
        // containers must be recreated
        logs.info(`pkg ${pkg.dnpName} has legacy dns, restarting it...`);
        await dockerComposeUp(getDockerComposePath(pkg.dnpName, pkg.isCore));
      }
    })
  );
}
