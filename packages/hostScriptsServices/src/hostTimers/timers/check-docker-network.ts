import { runTimer } from "../runTimer.js";

/**
 * check-docker-network.timer to be run on boot and every hour
 */
export async function checkDockerNetwork(): Promise<void> {
  await runTimer("check-docker-network.timer");
}
