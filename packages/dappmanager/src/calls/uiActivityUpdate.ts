import * as db from "@dappnode/db";

/**
 * Updates the UI activity metrics.
 * Called periodically from the admin-ui to report user activity.
 * @param isActive Whether the user is currently active
 * @param sessionStartTimestamp When the current session started (Unix epoch seconds)
 */
export async function uiActivityUpdate({
  isActive,
  sessionStartTimestamp
}: {
  isActive: boolean;
  sessionStartTimestamp: number;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  db.uiActivity.set({
    isActive,
    lastActivityTimestamp: now,
    sessionStartTimestamp
  });
}

/**
 * Gets the current UI activity metrics.
 */
export async function uiActivityGet(): Promise<db.UiActivityData> {
  return db.uiActivity.get();
}
