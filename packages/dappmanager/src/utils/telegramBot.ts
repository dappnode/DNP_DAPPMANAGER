import TelegramBot from "node-telegram-bot-api";
import * as db from "../db";

/**
 * Tlegram bot
 * @param telegramMessage
 */
export async function telegramBot(telegramMessage?: string): Promise<void> {
  const telegramToken = db.telegramToken.get();
  const telegramStatus = db.telegramStatus.get();
  if (telegramStatus && telegramToken) {
    let telegramChannelId = db.telegramChannelId.get();
    try {
      const bot = new TelegramBot(telegramToken, { polling: telegramStatus });

      bot.onText(/\/channel/, async msg => {
        const chatId = msg.chat.id;
        telegramChannelId = chatId;
        db.telegramChannelId.set(chatId);

        await bot.sendMessage(chatId, "Succesfully saved channel ID");
      });

      if (telegramChannelId && telegramMessage) {
        await bot.sendMessage(telegramChannelId, telegramMessage);
      }
    } catch (e) {
      throw Error("Error sending telegram message");
    }
  }
}
