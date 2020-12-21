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
      return `❌ 📢 *${telegramMessageType}*❗: ${telegramMessage}`;
    case "Danger":
      return `⚠ *${telegramMessageType}*❗: ${telegramMessage}`;
    case "Success":
      return `✅ *${telegramMessageType}* ✅: ${telegramMessage}`;
    case "Notification":
      return `🔔 *${telegramMessageType}* 🔔: ${telegramMessage}`;
    case "Stats":
      return `📊 *${telegramMessageType}* 📉: ${telegramMessage}`;
  }
}
