import path from "path";
import { params } from "@dappnode/params";
import { shellHost } from "@dappnode/utils";

const hostSystemdDir = params.HOST_SYSTEMD_DIR_FROM_HOST;
const hostTimerDir = params.HOST_TIMERS_DIR_FROM_HOST;

/**
 * Copies the timer to the default host path for timers:
 * /etc/systemd/system
 */
export async function copyHostTimer(timerName: string): Promise<void> {
  const timerSourcePath = path.join(hostTimerDir, timerName);
  const timerDestPath = path.join(hostSystemdDir, timerName);

  // --update: copy only when the SOURCE file is newer than the destination file
  // or when the destination file is missing
  await shellHost(`cp -- --update ${timerSourcePath} ${timerDestPath}`);
}
