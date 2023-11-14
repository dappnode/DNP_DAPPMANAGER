import * as db from "@dappnode/db";
import { setPending } from "./setPending.js";
import { params } from "@dappnode/params";

export const updateDelay = getRandomizedInterval(
  params.AUTO_UPDATE_DELAY,
  params.AUTO_UPDATE_DELAY_VARIATION
);

/**
 * Randomize an interval
 *
 * Example:
 * getRandomizedInterval(50, 10) // 50 +/- 10 = [40, 60]
 *
 * @param baseInterval
 * @param variation
 * @returns
 */
function getRandomizedInterval(
  baseInterval: number,
  variation: number
): number {
  const randomAdjustment = Math.round((Math.random() * 2 - 1) * variation); // Random integer between -variation and +variation
  return baseInterval + randomAdjustment;
}

/**
 * Auto-updates must be performed 24h after "seeing" the new version
 * - There is a "pending" queue with only one possible slot
 * - If the version is seen for the first time, it will be added
 *   to the queue and delete the older queue item if any
 * - If the version is the same as the one in the queue, the delay
 *   will be checked and if it's completed the update is authorized
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param version "0.2.5"
 * @param timestamp Use ONLY to make tests deterministic
 */
export function isUpdateDelayCompleted(
  dnpName: string,
  version: string,
  timestamp?: number
): boolean {
  if (!timestamp) timestamp = Date.now();

  const pending = db.autoUpdatePending.get();
  const pendingUpdate = pending[dnpName];

  if (pendingUpdate && pendingUpdate.version === version) {
    const { scheduledUpdate, completedDelay } = pendingUpdate;
    if (scheduledUpdate && timestamp > scheduledUpdate) {
      // Flag the delay as completed (if necessary) and allow the update
      if (!completedDelay) setPending(dnpName, { completedDelay: true });
      return true;
    } else {
      // Do not allow the update, the delay is not completed
      return false;
    }
  } else {
    // Start the delay object by recording the first seen time
    setPending(dnpName, {
      version,
      firstSeen: timestamp,
      scheduledUpdate: timestamp + updateDelay,
      completedDelay: false
    });
    return false;
  }
}
