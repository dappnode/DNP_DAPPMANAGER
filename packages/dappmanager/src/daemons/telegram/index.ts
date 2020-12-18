import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { checkAlerts } from "./checkAlerts";
import { getChannelId } from "./getChannelId";

/**
 * Telegram bot
 * @param telegramMessage
 */
export async function telegramBot(): Promise<void> {
  eventBus.telegramStatusChanged.on(status => {
    if (status === true) {
      const telegramToken = db.telegramToken.get();
      if (!telegramToken) throw Error("Error: telegram token must exist");
      getChannelId(telegramToken);
      checkAlerts(telegramToken);
    }
  });
}
