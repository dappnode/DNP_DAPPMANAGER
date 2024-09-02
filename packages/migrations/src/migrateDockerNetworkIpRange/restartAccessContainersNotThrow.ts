import { docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";

export async function restartAccessContainersNotThrow(): Promise<void> {
  for (const accessContainerName of [
    params.wireguardContainerName,
    params.vpnContainerName,
    params.wifiContainerName
  ]) {
    try {
      await docker.getContainer(accessContainerName).restart();
      logs.info(`restarted ${accessContainerName} container to reroute requests`);
    } catch (e) {
      if (e.statusCode === 404) {
        // vpn container does not exist
        logs.info(`${accessContainerName} not found`);
      } else
        logs.error(
          `ATTENTION: ${accessContainerName} could not be restarted. Manual actions could be needed in order to recover VPN access`
        );
    }
  }
}
