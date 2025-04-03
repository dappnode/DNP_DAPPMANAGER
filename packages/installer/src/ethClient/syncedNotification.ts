import * as db from "@dappnode/db";
import { Eth2ClientTarget, EthClientStatus } from "@dappnode/types";

/**
 * Send a notification when going from syncing to synced only once per target
 */
export function emitSyncedNotification(target: Eth2ClientTarget, status: EthClientStatus): void {
  if (target === "remote" || !target.execClient) return;
  const syncedStatus = db.ethClientSyncedNotificationStatus.get();

  if (
    !status.ok &&
    status.code === "IS_SYNCING" &&
    (!syncedStatus || syncedStatus.execClientTarget !== target.execClient)
  ) {
    // None -> AwaitingSynced
    db.ethClientSyncedNotificationStatus.set({
      execClientTarget: target.execClient,
      status: "AwaitingSynced"
    });
  } else if (
    status.ok &&
    syncedStatus &&
    syncedStatus.execClientTarget === target.execClient &&
    syncedStatus.status === "AwaitingSynced"
  ) {
    // AwaitingSynced -> Synced
    db.ethClientSyncedNotificationStatus.set({
      execClientTarget: target.execClient,
      status: "Synced"
    });
  }
}
