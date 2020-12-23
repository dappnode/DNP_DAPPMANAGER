import * as db from "../db";
import { eventBus } from "../eventBus";

/**
 * Sets the telegram token
 *
 * @param telegramToken New telegram token
 */
export async function setTelegramToken({
  telegramToken
}: {
  telegramToken: string;
}): Promise<void> {
  db.telegramToken.set(telegramToken);
  eventBus.telegramStatusChanged.emit();
}
