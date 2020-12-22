import TelegramBot from "node-telegram-bot-api";
import * as db from "../../db";
import { logs } from "../../logs";
import { bold, buildTelegramMessage, url } from "./buildTelegramMessage";
import { commandsList } from "./commandsList";

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

    // Listen for any messages. If channel ID does not exists, it saves the channel ID
    bot.on("message", async msg => {
      if (msg.text && commandsList.includes(msg.text) === false)
        try {
          const chatId = msg.chat.id.toString();
          const channelExists = checkIfChannelIdExists(chatId);
          if (channelExists === false) {
            const message = buildTelegramMessage({
              telegramMessage: "Succesfully saved channel ID",
              telegramMessageType: "Success"
            });
            subscribeChannelId(chatId);
            await sendTelegramMessage({ bot, chatId, message });
          }
        } catch (e) {
          logs.error("Error on telegram daemon. message polling", e);
        }
    });

    // Remove channel ID
    bot.onText(/\/unsubscribe/, async msg => {
      try {
        const chatId = msg.chat.id.toString();
        let message = "";
        const channelExists = checkIfChannelIdExists(chatId);
        if (channelExists === true) {
          unsubscribeChannelId(chatId);
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

        await sendTelegramMessage({ bot, chatId, message });
      } catch (e) {
        logs.error("Error on telegram daemon. /unsubscribe command", e);
      }
    });

    // Returns help content
    bot.onText(/\/help/, async msg => {
      try {
        const chatId = msg.chat.id.toString();
        const message = buildTelegramMessage({
          telegramMessage: `${bold("Commands")}:\n
           ${bold("/unsubscribe")} unsubscribes the channel\n
           ${bold("/help")} returns help content\n
            More information ${url(
              "here",
              "https://hackmd.io/iJngUGVkRMqxOEqFEjT0XA"
            )}`,
          telegramMessageType: "Help"
        });

        await sendTelegramMessage({ bot, chatId, message });
      } catch (e) {
        logs.error("Error on telegram daemon. /help command", e);
      }
    });
  } catch (e) {
    throw Error("Error sending telegram message");
  }
}

// TELEGRAM COMMANDS UTILS

async function sendTelegramMessage({
  bot,
  chatId,
  message
}: {
  bot: TelegramBot;
  chatId: string;
  message: string;
}): Promise<void> {
  await bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
}

function checkIfChannelIdExists(chatId: string): boolean {
  const channelIds = db.telegramChannelIds.get();
  if (channelIds.includes(chatId)) {
    return true;
  } else {
    return false;
  }
}

function subscribeChannelId(channelId: string): void {
  const channelIds = db.telegramChannelIds.get();
  channelIds.push(channelId);
  db.telegramChannelIds.set(channelIds);
}

function unsubscribeChannelId(channelId: string): void {
  const channelIds = db.telegramChannelIds.get();
  channelIds.splice(channelIds.indexOf(channelId), 1);
  db.telegramChannelIds.set(channelIds);
}
