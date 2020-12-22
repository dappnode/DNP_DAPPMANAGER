import { TelegramMessageHeader } from "./types";

/**
 * Returns the message formatted with the header
 * @param param0
 */
export function buildTelegramMessage({
  header,
  telegramMessage
}: {
  header: TelegramMessageHeader;
  telegramMessage: string;
}): string {
  const head = formatTelegramHeader(header);
  return bold("DAppNode ") + head + telegramMessage;
}

/**
 * Builds the telegram header
 * @param param0
 */
function formatTelegramHeader(header: TelegramMessageHeader): string {
  switch (header) {
    case "Alert":
      return `❌ 📢 ${bold(header)}❗:\n`;
    case "Danger":
      return `⚠ ${bold(header)} ⚡:\n`;
    case "Success":
      return `✅ ${bold(header)} ✅:\n`;
    case "Notification":
      return `🔔 ${bold(header)} 🔔:\n`;
    case "Stats":
      return `📊 ${bold(header)} 📉:\n`;
    case "Note":
      return `📋 ${bold(header)} 📋:\n`;
    case "Help":
      return `ℹ️ ${bold(header)} ℹ️:\n `;
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
