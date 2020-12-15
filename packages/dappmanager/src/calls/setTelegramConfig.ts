import TelegramBot from "node-telegram-bot-api";
import * as db from "../db";

/**
 * Sets the telegram configuration
 *
 * @param telegramToken New telegram token
 */
export async function setTelegramConfig({
  telegramToken,
  telegramStatus,
  telegramChannelId
}: {
  telegramToken: string;
  telegramStatus: boolean;
  telegramChannelId?: string | number | null;
}): Promise<void> {
  db.telegramStatus.set(telegramStatus);
  db.telegramToken.set(telegramToken);

  // Manually set channel ID
  if (telegramChannelId) db.telegramChannelId.set(telegramChannelId);

  // Automatic set channel ID
  if (telegramStatus && !db.telegramChannelId)
    await getTelegramChannelId(telegramToken);
}

/**
 * Polls messages to get the channel ID
 * @param telegramToken
 */
async function getTelegramChannelId(telegramToken: string): Promise<void> {
  try {
    const bot = new TelegramBot(telegramToken, { polling: true });
    bot.on("message", async msg => {
      const chatId = msg.chat.id;

      db.telegramChannelId.set(chatId);
      await bot.sendMessage(chatId, "Saved channel ID");
      await bot.stopPolling();
    });
  } catch (e) {
    throw Error("Error getting the channel ID");
  }
}
