import TelegramBot from "node-telegram-bot-api";
import { statsDiskGet } from "../../calls";
import * as db from "../../db";
import { logs } from "../../logs";
import { buildTelegramMessage } from "./buildTelegramMessage";

/**
 * Polls for commands and responds.
 * Channel ID is not needed to response to messages
 * @param telegramToken
 */
export async function telegramCommands(bot: TelegramBot): Promise<void> {
  try {
    bot.startPolling();
    // POLLING ERRORS
    // 1. EFATAL if error was fatal e.g. network error
    // 2. EPARSE if response body could not be parsed
    // 3. ETELEGRAM if error was returned from Telegram servers
    // ETELEGRAM: 409 Conflict  =>  More than one bot instance polling
    // ETELEGRAM: 404 Not Found => wrong token or not found
    bot.on("polling_error", error => {
      throw Error(`${error.name}: ${error.message}`);
    });
    // get disk stats
    bot.onText(/\/disk/, async msg => {
      try {
        const chatId = msg.chat.id;
        const diskStats = await statsDiskGet();
        const diskMessage = `*Disk free:* ${diskStats.free} | *Disk used:* ${diskStats.used} | *Disk total:* ${diskStats.total} | *Disk percentage:* ${diskStats.usedPercentage}`;
        const message = buildTelegramMessage({
          telegramMessage: diskMessage,
          telegramMessageType: "Stats"
        });

        await bot.sendMessage(chatId, message);
      } catch (e) {
        logs.error("Error on telegram daemon. /disk command", e);
      }
    });
    // Investigate try catch telegram functions
    // set the channel ID
    bot.onText(/\/channel/, async msg => {
      try {
        const chatId = msg.chat.id.toString();
        const channelIds = db.telegramChannelIds.get();
        channelIds.push(chatId);
        db.telegramChannelIds.set(channelIds);
        const message = buildTelegramMessage({
          telegramMessage: "Succesfully saved channel ID",
          telegramMessageType: "Success"
        });

        await bot.sendMessage(chatId, message);
      } catch (e) {
        logs.error("Error on telegram daemon. /channel command", e);
      }
    });

    // Remove channel ID
    bot.onText(/\/channelremove/, async msg => {
      try {
        const chatId = msg.chat.id.toString();
        const channelIds = db.telegramChannelIds.get();
        let message = "";
        if (channelIds.includes(chatId)) {
          channelIds.splice(channelIds.indexOf(chatId), 1);
          db.telegramChannelIds.set(channelIds);
          message = buildTelegramMessage({
            telegramMessage: "Succesfully removed channel ID",
            telegramMessageType: "Success"
          });
        } else {
          message = buildTelegramMessage({
            telegramMessage: "Channel Id not found",
            telegramMessageType: "Danger"
          });
        }

        await bot.sendMessage(chatId, message);
      } catch (e) {
        logs.error("Error on telegram daemon. /channel command", e);
      }
    });
  } catch (e) {
    throw Error("Error sending telegram message");
  }
}
