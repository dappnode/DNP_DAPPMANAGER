import * as db from "../db/index.js";
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
export async function telegramStatusSet({
  telegramStatus
}: {
  telegramStatus: boolean;
}): Promise<void> {
  db.telegramStatus.set(telegramStatus);
  eventBus.telegramStatusChanged.emit();
}

/**
 * Returns the token of the telegram bot
 */
export async function telegramTokenGet(): Promise<string | null> {
  return db.telegramToken.get();
}

/**
 * Sets the telegram token
 * @param telegramToken New telegram token
 */
export async function telegramTokenSet({
  telegramToken
}: {
  telegramToken: string;
}): Promise<void> {
  db.telegramToken.set(telegramToken);
  eventBus.telegramStatusChanged.emit();
}
