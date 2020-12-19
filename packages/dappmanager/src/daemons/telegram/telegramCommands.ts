import TelegramBot from "node-telegram-bot-api";
import { statsDiskGet } from "../../calls";
import * as db from "../../db";
import { buildTelegramMessage } from "./buildTelegramMessage";

/**
 * Gets the channel ID
 * @param telegramToken
 */
export async function telegramCommands(telegramToken: string): Promise<void> {
  try {
    const bot = new TelegramBot(telegramToken, { polling: true });

    // get disk stats
    bot.onText(/\/disk/, async msg => {
      const chatId = msg.chat.id;
      const diskStats = await statsDiskGet();
      const diskMessage = `*Disk free:* ${diskStats.free} | *Disk used:* ${diskStats.used} | *Disk total:* ${diskStats.total} | *Disk percentage:* ${diskStats.usedPercentage}`;
      const message = buildTelegramMessage({
        telegramMessage: diskMessage,
        telegramMessageType: "Stats"
      });

      await bot.sendMessage(chatId, message);
    });

    // set the channel ID
    bot.onText(/\/channel/, async msg => {
      const chatId = msg.chat.id;
      db.telegramChannelId.set(chatId);

      await bot.sendMessage(chatId, "Succesfully saved channel ID");
    });
  } catch (e) {
    throw Error("Error sending telegram message");
  }
}
