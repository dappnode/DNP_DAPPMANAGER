import { NotificationType } from "../../types";
import { TelegramCommandMessageHeader } from "./types";

// TELEGRAM DAPPNODE NOTIFICATIONS MESSAGES

/**
 * Returns the message formatted with the header
 * @param param0
 */
export function buildTelegramNotificationMessage({
  notificationType,
  telegramMessage
}: {
  notificationType: NotificationType;
  telegramMessage: string;
}): string {
  const head = formatTelegramNotificationHeader(notificationType);
  return bold("DAppNode ") + head + telegramMessage;
}

/**
 * Builds the DAppNode notification header
 * @param param0
 */
function formatTelegramNotificationHeader(header: NotificationType): string {
  switch (header) {
    case "danger":
      return `⚠ ${bold(header)} ⚡:\n\n`;
    case "success":
      return `✅ ${bold(header)} ✅:\n\n`;
    case "warning":
      return `🔔 ${bold(header)} 🔔:\n\n`;
  }
}

// TELEGRAM COMMANDS MESSAGES

/**
 * Builds the telegram command message header
 * @param param0
 */
export function formatTelegramCommandHeader(
  header: TelegramCommandMessageHeader
): string {
  switch (header) {
    case "Fail":
      return `❌ `;
    case "Success":
      return `✅ `;
    case "Stats":
      return `📊 `;
    case "Note":
      return `📋 `;
    case "Help":
      return `ℹ️ `;
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
