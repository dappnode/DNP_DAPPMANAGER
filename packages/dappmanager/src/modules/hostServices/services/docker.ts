import memoize from "memoizee";
import { runService } from "../runServices";

/**
 * Updates docker engine:
 * - Docker engine should be updated to a stable version
 * - Update is done through a host service which starts the docker_update_engine.sh script
 * - Docker communication will be lost during the update and the container which starts the
 * host service will exit with an EXPECTED exit code 137
 * - `systemctl enable docker-update.service` would make the service to start on boot every single time
 */
export const updateDockerEngine = memoize(
  async function(): Promise<string> {
    return await runService("docker-update.service");
  },
  // Prevent running this service more than once
  { promise: true, maxAge: 2000 }
);
