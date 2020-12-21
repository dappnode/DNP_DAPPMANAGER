import { bold } from "./utils";

/**
 * Builds the telegram message to be sent
 * @param param0
 */
export function buildTelegramMessage({
  telegramMessage,
  telegramMessageType
}: {
  telegramMessage: string;
  telegramMessageType:
    | "Alert"
    | "Danger"
    | "Notification"
    | "Success"
    | "Stats";
}): string {
  switch (telegramMessageType) {
    case "Alert":
      return `❌ 📢 ${bold(telegramMessageType)}❗: ${telegramMessage}`;
    case "Danger":
      return `⚠ ${bold(telegramMessageType)}❗: ${telegramMessage}`;
    case "Success":
      return `✅ ${bold(telegramMessageType)} ✅: ${telegramMessage}`;
    case "Notification":
      return `🔔 ${bold(telegramMessageType)} 🔔: ${telegramMessage}`;
    case "Stats":
      return `📊 ${bold(telegramMessageType)} 📉: ${telegramMessage}`;
  }
}
