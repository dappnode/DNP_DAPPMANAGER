import TelegramBot from "node-telegram-bot-api";
import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { logs } from "../../logs";
import { buildTelegramMessage } from "./buildTelegramMessage";
import { telegramCommands } from "./telegramCommands";

// Telegram setup When reboot it lost
let currentTelegramToken: string | null;
let bot: TelegramBot | null = null;

/**
 * This function should be called once after dappmanager
 * reboot and on telegram status event subscription
 */
async function checkTelegramStatus(): Promise<void> {
  try {
    const isEnabled = db.telegramStatus.get();
    const telegramToken = db.telegramToken.get();
    if (isEnabled === true) {
      if (!telegramToken) throw Error("Error: telegram token must exist");

      if (bot && telegramToken !== currentTelegramToken) {
        currentTelegramToken = telegramToken;
        bot.stopPolling();
        bot = null;
      }
      if (!bot) {
        bot = new TelegramBot(telegramToken);
      }

      telegramCommands(bot);
    } else if (isEnabled === false) {
      if (bot) {
        bot.stopPolling();
      }
    }
  } catch (e) {
    logs.error("Error on telegram status check", e);
  }
}

/**
 * Telegram bot
 * @param telegramMessage
 */
export async function startTelegramDaemon(): Promise<void> {
  //  When dappmanager reboots, it should persists the bot
  checkTelegramStatus();
  // User may change the telegramToken, if so currentTelegramToken (UNupdated)
  // will be used to compare it with the newToken and update it.
  currentTelegramToken = db.telegramToken.get();

  // NOTIFICATION SUBSCRIPTION => checks if either, token and status, have changed
  eventBus.telegramStatusChanged.on(() => {
    checkTelegramStatus();
  });

  // NOTIFICATION SUBSCRIPTION => checks if the packages has been stopped
  eventBus.notification.on(notification => {
    const telegramChannelIds = db.telegramChannelIds.get();

    if (!bot || telegramChannelIds.length === 0) return;

    if (
      notification.id === "diskSpaceRanOut-stoppedPackages" &&
      notification.type === "danger"
    ) {
      try {
        const message = buildTelegramMessage({
          telegramMessage: notification.body,
          telegramMessageType: "Alert"
        });
        for (const channelId of telegramChannelIds) {
          bot.sendMessage(channelId, message, {
            parse_mode: "MarkdownV2"
          });
        }
      } catch (e) {
        throw Error("Error: error happened sending telegram message");
      }
    }
  });
}
