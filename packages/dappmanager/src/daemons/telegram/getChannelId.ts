import TelegramBot from "node-telegram-bot-api";
import * as db from "../../db";

export async function getChannelId(telegramToken: string): Promise<void> {
  try {
    const bot = new TelegramBot(telegramToken, { polling: true });

    bot.onText(/\/channel/, async msg => {
      const chatId = msg.chat.id;
      db.telegramChannelId.set(chatId);

      await bot.sendMessage(chatId, "Succesfully saved channel ID");
    });
  } catch (e) {
    throw Error("Error sending telegram message");
  }
}
