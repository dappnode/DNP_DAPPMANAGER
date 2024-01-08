import { docker } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";

export async function restartVpnsNotThrow(): Promise<void> {
  for (const vpnContainerName of [
    params.wireguardContainerName,
    params.vpnContainerName,
  ]) {
    try {
      await docker.getContainer(vpnContainerName).restart();
      logs.info(`restarted ${vpnContainerName} container to reroute requests`);
    } catch (e) {
      if (e.statusCode === 404) {
        // vpn container does not exist
        logs.info(`${vpnContainerName} not found`);
      } else
        logs.error(
          `ATTENTION: ${vpnContainerName} could not be restarted. Manual actions could be needed in order to recover VPN access`
        );
    }
  }
}
