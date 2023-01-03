import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { Eth2ClientTarget, EthClientStatus } from "@dappnode/common";

/**
 * Send a notification when going from syncing to synced only once per target
 */
export function emitSyncedNotification(
  target: Eth2ClientTarget,
  status: EthClientStatus
): void {
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
    eventBus.notification.emit({
      id: `eth-client-synced-${target}`,
      type: "success",
      title: "Ethereum node synced",
      body: `Your DAppNode's Ethereum node ${target} is synced.`
    });
  }
}
