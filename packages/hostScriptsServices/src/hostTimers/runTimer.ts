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
  name: "recreate-dappnode.timer";
  dependantService: ServiceName;
};

/**
 * Returns the ordered list of candidate paths where a host timer unit file may exist.
 * Exported for testing purposes.
 */
export function getCandidateTimerPaths(timerName: string): string[] {
  return [
    // Primary: absolute source dir set in params (Dockerfile copies hostTimers here)
    path.join(params.HOST_TIMERS_SOURCE_DIR, timerName),
    // Fallback 1: DNCORE bind-volume path inside the container
    path.join("/usr/src/app/DNCORE/timers/host", timerName),
    // Fallback 2: package directory copied by the build stage
    path.join("/app/packages/hostScriptsServices/hostTimers", timerName)
  ];
}

/**
 * Resolve the path of a timer unit file, trying multiple candidate locations.
 * Returns the first path that exists, or undefined if none are found.
 * @param timerName - name of the timer unit file
 * @param candidatePaths - optional override for candidate paths (used in tests)
 */
export function resolveTimerPath(timerName: string, candidatePaths?: string[]): string | undefined {
  const paths = candidatePaths ?? getCandidateTimerPaths(timerName);
  return paths.find((p) => fs.existsSync(p));
}

/**
 * Run a timer for the hostTimer folder
 * @param timer {name: "check-docker-network.timer", dependantService: ""check-docker-network.service"}
 * sytemd timer info: https://manpages.debian.org/testing/systemd/systemd.timer.5.en.html
 *
 * Timers usually are linked to a service
 */
export async function runTimer(timer: Timer): Promise<string> {
  try {
    // Check if timer exists in any known location
    const timerPath = resolveTimerPath(timer.name);
    if (!timerPath) {
      const tried = getCandidateTimerPaths(timer.name).join(", ");
      throw Error(`Host timer ${timer.name} not found. Tried: ${tried}`);
    }

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
