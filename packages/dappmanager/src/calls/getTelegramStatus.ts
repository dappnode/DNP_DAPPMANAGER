import * as db from "../db";

/**
 * Returns the status of the telegram bot
 */
export function getTelegramStatus(): boolean {
  return db.telegramStatus.get();
}
