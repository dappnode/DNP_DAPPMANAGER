import { docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";

export async function restartWireguardNotThrow(): Promise<void> {
  try {
    await docker.getContainer(params.wireguardContainerName).restart();
    logs.info(
      `restarted ${params.wireguardContainerName} container to reroute requests`
    );
  } catch (e) {
    if (e.statusCode === 404) {
      // wireguard container does not exist
      logs.info(`${params.wireguardContainerName} not found`);
    } else
      logs.error(
        `ATTENTION: ${params.wireguardContainerName} could not be restarted. Manual actions could be needed in order to recover Wireguard access`
      );
  }
}
