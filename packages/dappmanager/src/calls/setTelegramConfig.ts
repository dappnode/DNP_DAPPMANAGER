import * as db from "../db";
import { telegramBot } from "../utils/telegramBot";

/**
 * Sets the telegram configuration
 *
 * @param telegramToken New telegram token
 * @param telegramStatus switch telegram bot status
 */
export async function setTelegramConfig({
  telegramToken,
  telegramStatus
}: {
  telegramToken: string;
  telegramStatus: boolean;
}): Promise<void> {
  db.telegramStatus.set(telegramStatus);
  db.telegramToken.set(telegramToken);

  await telegramBot();
}
