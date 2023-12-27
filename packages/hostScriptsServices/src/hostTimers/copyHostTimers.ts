import { params } from "@dappnode/params";
import { copyOnHost } from "../copyOnHost.js";

const hostTimersDir = params.HOST_TIMERS_DIR;
const hostTimersDirSource = params.HOST_TIMERS_SOURCE_DIR;

/**
 * Copies the Timers to the host shared folder
 * - Add new Timers
 * - Update Timers by comparing sha256 hashes
 * - Remove Timers that are not here
 * @returns For info and logging
 */
export async function copyHostTimers(): Promise<void> {
  await copyOnHost({
    hostDir: hostTimersDir,
    hostDirSource: hostTimersDirSource,
  });
}
