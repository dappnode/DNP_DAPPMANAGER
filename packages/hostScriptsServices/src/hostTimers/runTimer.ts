import path from "path";
import fs from "fs";
import { params } from "@dappnode/params";
import { shellHost } from "@dappnode/utils";
import { copyHostTimer } from "./copyHostTimer.js";
import { ServiceName } from "../hostServices/runService.js";
import { copyHostService } from "../hostServices/copyHostService.js";

/**
 * Timers runners. Helps ensure no typos
 * Timers usually runs services which in the end runs scripts
 */
type Timer = {
  name: "check-docker-network.timer" | "recreate-dappnode.timer";
  dependantService: ServiceName;
};

/**
 * Run a timer for the hostTimer folder
 * @param timer {name: "check-docker-network.timer", dependantService: ""check-docker-network.service"}
 * sytemd timer info: https://manpages.debian.org/testing/systemd/systemd.timer.5.en.html
 *
 * Timers usually are linked to a service
 */
export async function runTimer(timer: Timer): Promise<string> {
  const timerPath = path.resolve(params.HOST_TIMERS_SOURCE_DIR, timer.name);
  try {
    // Check if timer exists
    if (!fs.existsSync(timerPath)) throw Error(`Host timer ${timer.name} not found`);

    // Copy timer and service into shared volume
    await copyHostService(timer.dependantService);
    await copyHostTimer(timer.name);

    // Enable timer
    await shellHost(`systemctl enable ${timer.name}`);
    // Run timer
    return await shellHost(`systemctl start ${timer.name}`);
  } catch (e) {
    e.message = `Error running timer ${timer.name}: ${e.message}`;
    throw e;
  }
}
