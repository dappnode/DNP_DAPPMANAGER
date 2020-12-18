import TelegramBot from "node-telegram-bot-api";
import * as db from "../../db";
import { eventBus } from "../../eventBus";

export async function checkAlerts(telegramToken: string): Promise<void> {
  const telegramChannelId = db.telegramChannelId.get();
  eventBus.notification.on(notification => {
    if (
      notification.id === "diskSpaceRanOut-stoppedPackages" &&
      notification.type === "danger"
    ) {
      if (!telegramChannelId) throw Error("Error: channel ID must exist");
      try {
        const bot = new TelegramBot(telegramToken);
        bot.sendMessage(
          telegramChannelId,
          `${notification.title} ${notification.body}`
        );
      } catch (e) {
        throw Error("Error: error happened when sending telegram message");
      }
    }
  });
}
