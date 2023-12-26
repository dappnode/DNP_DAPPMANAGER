import path from "path";
import fs from "fs";
import { params } from "@dappnode/params";
import { shellHost } from "@dappnode/utils";
import { copyHostTimer } from "./copyHostTimer.js";

/**
 * Timers runners. Helps ensure no typos
 */
type TimerName = "check-docker-network.timer";

/**
 * Run a timer for the hostTimer folder
 * @param timer "update-docker-engine.timer"
 * sytemd timer info: https://manpages.debian.org/testing/systemd/systemd.timer.5.en.html
 */
export async function runTimer(timer: TimerName, args = ""): Promise<string> {
  const timerPath = path.resolve(params.HOST_TIMERS_SOURCE_DIR, timer);
  try {
    // Check if timer exists
    if (!fs.existsSync(timerPath)) throw Error(`Host timer ${timer} not found`);

    // Copy timer into shared volume
    await copyHostTimer(timer);

    // Enable timer
    await shellHost(`systemctl enable ${timer}`);
    // Run timer
    return await shellHost(`systemctl start ${timer} ${args}`);
  } catch (e) {
    e.message = `Error running timer ${timer}: ${e.message}`;
    throw e;
  }
}
