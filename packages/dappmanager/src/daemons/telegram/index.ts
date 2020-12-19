import TelegramBot from "node-telegram-bot-api";
import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { buildTelegramMessage } from "./buildTelegramMessage";
import { telegramCommands } from "./telegramCommands";

/**
 * Telegram bot
 * @param telegramMessage
 */
export async function startTelegramDaemon(): Promise<void> {
  // Subscribe to event telegramStatus
  eventBus.telegramStatusChanged.on(status => {
    if (status === true) {
      const telegramToken = db.telegramToken.get();
      if (!telegramToken) throw Error("Error: telegram token must exist");
      // In this case, Telegram channel ID is not needed in the db, it can be taken from the message
      telegramCommands(telegramToken);
    }
  });

  const telegramChannelId = db.telegramChannelId.get();

  // Subscribe to event notification disk space -> stopped packages
  eventBus.notification.on(notification => {
    const statusTelegram = db.telegramStatus.get();
    if (!statusTelegram) return;
    if (
      notification.id === "diskSpaceRanOut-stoppedPackages" &&
      notification.type === "danger"
    ) {
      const telegramToken = db.telegramToken.get();
      if (!telegramChannelId) throw Error("Error: channel ID must exist"); // channel ID needed to send messages that are no responses
      if (!telegramToken) return; // When telegram token is not defined then the message cannot be sent

      try {
        const bot = new TelegramBot(telegramToken);
        const message = buildTelegramMessage({
          telegramMessage: notification.body,
          telegramMessageType: "Alert"
        });
        bot.sendMessage(telegramChannelId, message, {
          parse_mode: "MarkdownV2"
        });
      } catch (e) {
        throw Error("Error: error happened sending telegram message");
      }
    }
  });
}
// is a problem to create new bot instance every single time?
