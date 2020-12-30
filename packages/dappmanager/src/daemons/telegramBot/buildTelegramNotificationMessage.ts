import { NotificationType } from "../../types";
import { bold } from "./markdown";

// TELEGRAM DAPPNODE NOTIFICATIONS MESSAGES
// In this file are the functions related to build DAppNode notification messages

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
  return bold("DAppNode ") + head + parseStoppedPackages(telegramMessage);
}

/**
 * Builds the DAppNode notification header
 * @param param0
 */
function formatTelegramNotificationHeader(header: NotificationType): string {
  switch (header) {
    case "danger":
      return `⚠ ${bold(header)} ⚠:\n\n`;
    case "success":
      return `✅ ${bold(header)} ✅:\n\n`;
    case "warning":
      return `⚡ ${bold(header)} ⚡:\n\n`;
  }
}

/**
 * Parses the message and list the stopped packages in a beautiful way
 * @param message
 */
function parseStoppedPackages(message: string): string {
  const arr = message.split(/[()]/);
  const packagesList = arr[1]
    .split(", ")
    .map(item => "- " + item + "\n")
    .join("");
  return (
    arr[0] +
    "\n\n" +
    bold("Stopped packages:") +
    "\n" +
    packagesList +
    "\n" +
    arr[2]
  );
}
