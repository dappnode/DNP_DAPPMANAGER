import * as db from "../db";

/**
 * Sets the telegram token
 *
 * @param telegramToken New telegram token
 */
export async function setTelegramToken(telegramToken: string): Promise<void> {
  db.telegramToken.set(telegramToken);
}
