import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { logs } from "@dappnode/logger";
import { runOnlyOneSequentially } from "@dappnode/utils";
import { formatNotification } from "./formatNotification.js";
import { DappnodeTelegramBot } from "./commands.js";

// Telegram setup When reboot it lost
let currentTelegramToken: string | null;
let bot: DappnodeTelegramBot | null = null;

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

      // Token changed, stop and destroy existing instance
      if (bot && telegramToken !== currentTelegramToken) {
        currentTelegramToken = telegramToken;
        await bot.stop();
        bot = null;
      }

      // Create new instance or restart existing
      if (!bot) {
        bot = new DappnodeTelegramBot(telegramToken);
      }

      await bot.start();
    } else {
      if (bot) {
        await bot.stop();
      }
    }
  } catch (e) {
    logs.error("Error on telegram status check", e);
  }
}

const checkTelegramStatusThrottled =
  runOnlyOneSequentially(checkTelegramStatus);

/**
 * Telegram bot
 * @param telegramMessage
 */
export async function startTelegramBotDaemon(): Promise<void> {
  // Make sure that the DAPPMANAGER starts the bot on start-up
  checkTelegramStatusThrottled();

  // User may change the telegramToken, if so currentTelegramToken (UNupdated)
  // will be used to compare it with the newToken and update it.
  currentTelegramToken = db.telegramToken.get();

  // 'telegramStatusChanged' event is emitted when
  // user changes telegram status or token via an API call
  eventBus.telegramStatusChanged.on(() => {
    checkTelegramStatusThrottled();
  });

  // NOTIFICATION SUBSCRIPTION => checks if the packages has been stopped
  eventBus.notification.on(async notification => {
    try {
      const telegramChannelIds = db.telegramChannelIds.get();

      if (!bot || telegramChannelIds.length === 0) {
        return;
      }

      const message = formatNotification(notification);

      await Promise.all(
        telegramChannelIds.map(async channelId => {
          if (bot) await bot.sendMessage(channelId, message);
        })
      );
    } catch (e) {
      logs.error("Error sending notification over telegram", e);
    }
  });
}
