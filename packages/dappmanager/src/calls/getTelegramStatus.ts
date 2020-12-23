import * as db from "../db";

/**
 * Returns the status of the telegram bot
 */
export async function getTelegramStatus(): Promise<boolean> {
  return db.telegramStatus.get();
}
