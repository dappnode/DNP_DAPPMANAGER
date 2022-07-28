import {
  addChannelId,
  channelIdExists,
  removeChannelId
} from "../daemons/telegramBot/commands";
import * as db from "../db";
import { eventBus } from "../eventBus";

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

/**
 * Sets a new telegram channel id into the whitelist
 */
export async function telegramChannelIdWhitelistSet({
  channelId
}: {
  channelId: string;
}): Promise<void> {
  if (!channelIdExists(channelId)) addChannelId(channelId);
}

/**
 * Gets the telegram channel id whitelist
 */
export async function telegramChannelIdWhitelistGet(): Promise<string[]> {
  return db.telegramChannelIds.get();
}

/**
 * Removes a telegram channel id from the whitelist
 */
export async function telegramChannelIdWhitelistRemove({
  telegramChannelId
}: {
  telegramChannelId: string;
}): Promise<void> {
  removeChannelId(telegramChannelId);
}
