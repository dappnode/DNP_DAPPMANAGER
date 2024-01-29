import { logs } from "@dappnode/logger";
import { runTimer } from "../runTimer.js";

/**
 * recreate-dappnode.timer to be run on boot and every 6 hours
 */
export async function recreateDappnode(): Promise<void> {
  const response = await runTimer({
    name: "recreate-dappnode.timer",
    dependantService: "recreate-dappnode.service",
  });
  logs.info(
    `Successfully started recreate dappnode to latest service ${response}`
  );
}
