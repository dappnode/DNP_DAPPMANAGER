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
    | "Stats"
    | "Help"
    | "Note";
}): string {
  const dappNodeMessage = "DAppNode ";
  switch (telegramMessageType) {
    case "Alert":
      return `❌ 📢 ${bold(dappNodeMessage + telegramMessageType)}❗:\n
      ${telegramMessage}`;
    case "Danger":
      return `⚠ ${bold(dappNodeMessage + telegramMessageType)} ⚡:\n
      ${telegramMessage}`;
    case "Success":
      return `✅ ${bold(dappNodeMessage + telegramMessageType)} ✅:\n   
      ${telegramMessage}`;
    case "Notification":
      return `🔔 ${bold(dappNodeMessage + telegramMessageType)} 🔔:\n
      ${telegramMessage}`;
    case "Stats":
      return `📊 ${bold(dappNodeMessage + telegramMessageType)} 📉:\n  
      ${telegramMessage}`;
    case "Note":
      return `📋 ${bold(dappNodeMessage + telegramMessageType)} 📋:\n
      ${telegramMessage}`;
    case "Help":
      return `ℹ️ ${bold(dappNodeMessage + telegramMessageType)} ℹ️:\n 
      ${telegramMessage}`;
  }
}

// MARKDOWN UTILS
export function bold(message: string): string {
  return "*" + message + "*";
}

export function italic(message: string): string {
  return "_" + message + "_";
}

export function hashtag(message: string): string {
  return "#" + message;
}

export function url(inlineUrl: string, url: string): string {
  return "[" + inlineUrl + "]" + "(" + url + ")";
}
