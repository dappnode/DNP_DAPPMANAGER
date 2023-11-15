// TELEGRAM COMMANDS MESSAGES
// In this file are the functions related to build messages responses to commands

import { TelegramCommandMessageHeader } from "./types.js";

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
