import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { EthClientStatus, EthClientTarget } from "../../types";

/**
 * Send a notification when going from syncing to synced only once per target
 */
export function emitSyncedNotification(
  target: EthClientTarget,
  status: EthClientStatus
): void {
  const syncedStatus = db.ethClientSyncedNotificationStatus.get();

  if (target === "remote") {
    return;
  }

  if (
    !status.ok &&
    status.code === "IS_SYNCING" &&
    (!syncedStatus || syncedStatus.target !== target)
  ) {
    // None -> AwaitingSynced
    db.ethClientSyncedNotificationStatus.set({
      target,
      status: "AwaitingSynced"
    });
  } else if (
    status.ok &&
    syncedStatus &&
    syncedStatus.target === target &&
    syncedStatus.status === "AwaitingSynced"
  ) {
    // AwaitingSynced -> Synced
    db.ethClientSyncedNotificationStatus.set({
      target,
      status: "Synced"
    });
    eventBus.notification.emit({
      id: `eth-client-synced-${target}`,
      type: "success",
      title: "Ethereum node synced",
      body: `Your DAppNode's Ethereum node ${target} is synced.`
    });
  }
}
