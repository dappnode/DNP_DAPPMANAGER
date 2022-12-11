import memoize from "memoizee";
import { runService } from "../runService";

/**
 * Updates docker engine:
 * - Docker engine should be updated to a stable version
 * - Update is done through a host service which starts the docker_update_engine.sh script
 * - Docker communication will be lost during the update and the container which starts the
 * host service will exit with an EXPECTED exit code 137
 * - `systemctl enable docker-update.service` would make the service to start on boot every single time
 * - When running this host service containers will restart and connection with the dappnode will be lost for a while
 */
export const updateDockerEngine = memoize(
  async function (): Promise<string> {
    return await runService("update-docker-engine.service", false);
  },
  // Prevent running this service more than once
  { promise: true, maxAge: 2000 }
);
