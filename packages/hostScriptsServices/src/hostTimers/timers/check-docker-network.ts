import { logs } from "@dappnode/logger";
import { runTimer } from "../runTimer.js";

/**
 * check-docker-network.timer to be run on boot and every hour
 */
export async function checkDockerNetwork(): Promise<void> {
  const response = await runTimer({
    name: "check-docker-network.timer",
    dependantService: "check-docker-network.service",
  });
  logs.info(`Successfully started checker docker network service ${response}`);
}
