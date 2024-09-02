import * as db from "@dappnode/db";

/**
 * Marks notifications as view by deleting them from the db
 *
 * @param ids Array of ids to be marked as read
 * ids = [ "notification-id1", "notification-id2" ]
 */
export async function notificationsRemove({ ids }: { ids: string[] }): Promise<void> {
  if (!ids) throw Error("kwarg ids must be defined");

  for (const id of ids) db.notification.remove(id);
}
