import memoize from "memoizee";
import { runService } from "../runService.js";

/**
 * Updates and upgrades the host by executing the update_upgrade.sh script
 * - The packages are updated and upgraded, docker must be treated specially and updated through the host service
 * to avoid breaking the linux child process which is running the update
 * - Docker communication will be lost during the update and the container which starts the
 * host service will exit with an EXPECTED exit code 137
 * - `systemctl enable update-upgrade-host.service` would make the service to start on boot every single time
 * - When running this host service containers will restart and connection with the dappnode will be lost for a while
 */
export const updateUpgradeHost = memoize(
  async function (): Promise<string> {
    return await runService("update-upgrade-host.service", false);
  },
  // Prevent running this service more than once
  { promise: true, maxAge: 2000 }
);
