import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";

export async function migrateNotificationsStatus(): Promise<void> {
  // skip of already migrated
  if (db.notificationsEnabled.get() !== null) return;

  try {
    logs.info("Determining if notifications are enabled");
    const areLegacyNotificationsEnabled = db.notifications.get()?.enabled;
    if (areLegacyNotificationsEnabled) {
      db.notificationsEnabled.set(true);
      logs.info(`Notifications enabled`);
    } else {
      db.notificationsEnabled.set(false);
      logs.info(`Notifications disabled`);
    }
  } catch (error) {
    logs.info(`Error while setting notifications status: ${error.message}`);
    db.notificationsEnabled.set(false);
  }
}
