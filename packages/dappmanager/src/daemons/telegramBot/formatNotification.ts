import { NotificationType, PackageNotification } from "@dappnode/common";
import { bold } from "./markdown";

// TELEGRAM DAPPNODE NOTIFICATIONS MESSAGES
// In this file are the functions related to build DAppNode notification messages

/**
 * Format a notification as a Telegram message with emojis
 */
export function formatNotification(notification: PackageNotification): string {
  return [
    `${typeToEmoji(notification.type)} ${bold(notification.title)}`,
    notification.body
  ].join("\n\n");
}

/**
 * Return emoji for a notification type
 */
function typeToEmoji(header: NotificationType): string {
  switch (header) {
    case "danger":
      return "❌";
    case "warning":
      return "⚠️";
    case "success":
      return "✅";
    case "info":
      return "ℹ️";
  }
}
