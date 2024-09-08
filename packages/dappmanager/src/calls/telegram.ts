import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";

/**
 * Returns the status of the telegram bot
 */
export async function telegramStatusGet(): Promise<boolean> {
  return db.telegramStatus.get();
}

/**
 * Sets the telegram status
 * @param telegramStatus switch telegram bot status
 */
export async function telegramStatusSet({ telegramStatus }: { telegramStatus: boolean }): Promise<void> {
  db.telegramStatus.set(telegramStatus);
  eventBus.telegramStatusChanged.emit();
}

/**
 * Get telegram configuration: token and user ID
 */
export async function telegramConfigGet(): Promise<{
  token: string | null;
  userId: string | null;
}> {
  return {
    token: db.telegramToken.get(),
    userId: db.telegramUserId.get()
  };
}

/**
 * Set telegram configuration: token and user ID
 */
export async function telegramConfigSet({ token, userId }: { token: string; userId: string }): Promise<void> {
  db.telegramToken.set(token);
  db.telegramUserId.set(userId);
  eventBus.telegramStatusChanged.emit();
}
