import os from "os";
import { logs } from "../logs";

// Cache static values
const numCores = os.cpus().length;

// Utils

/**
 * Uses nodejs native os.loadavg, which returns three factors
 * [0.124352, 0.16262, 0.32514]
 * [1 min, 5 min, 15 min] averages
 * This util takes only the 1min and limits it to 100%
 * @returns cpu usage percent "36%"
 */
function getCpuLoad(): string {
  let cpuFraction = os.loadavg()[0] / numCores;
  if (cpuFraction > 1) cpuFraction = 1;
  return Math.round(cpuFraction * 100) + "%";
}

/**
 * Wraps the shell calls to return null in case of error
 * @param fn async getter
 * @param name for the message
 */
async function wrapErrors<R>(
  fn: () => Promise<R>,
  name: string
): Promise<R | undefined> {
  try {
    return await fn();
  } catch (e) {
    logs.warn(`Error fetching ${name}`, e);
  }
}
