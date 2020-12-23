import TelegramBot from "node-telegram-bot-api";
import * as db from "../../db";
import { logs } from "../../logs";
import { formatTelegramCommandHeader } from "./buildTelegramCommandMessage";
import { commandsList } from "./commandsList";
import { bold, url } from "./markdown";

/**
 * Polls for commands and responds.
 * Channel ID is not needed to response to messages
 * @param telegramToken
 */
export async function telegramCommands(bot: TelegramBot): Promise<void> {
  bot.startPolling();
  // POLLING ERRORS
  // 1. EFATAL if error was fatal e.g. network error
  // 2. EPARSE if response body could not be parsed
  // 3. ETELEGRAM if error was returned from Telegram servers
  // ETELEGRAM: 409 Conflict  =>  More than one bot instance polling
  // ETELEGRAM: 404 Not Found => wrong token or not found
  bot.on("polling_error", error => {
    logs.error(`${error.name}: ${error.message}`);
  });

  // Listen for any messages. If channel ID does not exists, it saves the channel ID
  bot.on("message", async msg => {
    if (msg.text && !commandsList.includes(msg.text))
      try {
        const chatId = msg.chat.id.toString();
        if (!checkIfChannelIdExists(chatId)) {
          const message =
            formatTelegramCommandHeader("Success") +
            "Succesfully saved channel ID";
          subscribeChannelId(chatId);
          await sendTelegramMessage({ bot, chatId, message });
        }
      } catch (e) {
        logs.error("Error on telegram message handler", e);
      }
  });

  // Remove channel ID
  bot.onText(/\/unsubscribe/, async msg => {
    try {
      const chatId = msg.chat.id.toString();
      let message = "";
      if (checkIfChannelIdExists(chatId)) {
        unsubscribeChannelId(chatId);
        message =
          formatTelegramCommandHeader("Success") +
          "Succesfully removed channel ID";
      } else {
        message = formatTelegramCommandHeader("Fail") + "Channel ID not found";
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
      const message = [
        bold("Commands"),
        bold("/unsubscribe"),
        bold("/help"),
        `More information ${url(
          "here",
          "https://hackmd.io/iJngUGVkRMqxOEqFEjT0XA"
        )}`
      ].join("\n\n");

      await sendTelegramMessage({ bot, chatId, message });
    } catch (e) {
      logs.error("Error on telegram daemon. /help command", e);
    }
  });
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
  return channelIds.includes(chatId);
}

function subscribeChannelId(channelId: string): void {
  const channelIds = db.telegramChannelIds.get();
  channelIds.push(channelId);
  db.telegramChannelIds.set(channelIds);
}

function unsubscribeChannelId(channelId: string): void {
  const channelIds = db.telegramChannelIds.get();
  db.telegramChannelIds.set(channelIds.filter(chatId => chatId !== channelId));
}
