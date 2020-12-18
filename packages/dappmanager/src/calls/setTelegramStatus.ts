import * as db from "../db";
import { eventBus } from "../eventBus";

/**
 * Sets the telegram status
 *
 * @param telegramStatus switch telegram bot status
 */
export async function setTelegramStatus(
  telegramStatus: boolean
): Promise<void> {
  db.telegramStatus.set(telegramStatus);

  // consider using string 'enable' / 'disable' instead of boolean
  eventBus.telegramStatusChanged.emit(telegramStatus);
}
