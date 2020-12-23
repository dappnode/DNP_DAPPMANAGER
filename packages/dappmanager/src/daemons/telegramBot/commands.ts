import TelegramBot from "node-telegram-bot-api";
import { uniq } from "lodash";
import * as db from "../../db";
import { logs } from "../../logs";
import { formatTelegramCommandHeader } from "./buildTelegramCommandMessage";
import { bold, url } from "./markdown";

const messageOptions: TelegramBot.SendMessageOptions = {
  parse_mode: "Markdown"
};

/**
 * Polls for commands and responds.
 * Channel ID is not needed to response to messages
 */
export class DappnodeTelegramBot extends TelegramBot {
  constructor(telegramToken: string) {
    super(telegramToken);

    this.startPolling();

    // POLLING ERRORS
    // 1. EFATAL if error was fatal e.g. network error
    // 2. EPARSE if response body could not be parsed
    // 3. ETELEGRAM if error was returned from Telegram servers
    // ETELEGRAM: 409 Conflict  =>  More than one bot instance polling
    // ETELEGRAM: 404 Not Found => wrong token or not found
    this.on("polling_error", error => {
      logs.error(`${error.name}: ${error.message}`);
    });

    // Listen for any messages. If channel ID does not exists, it saves the channel ID
    this.on("message", async msg => {
      try {
        if (!msg.text) return;

        if (/\/unsubscribe/.test(msg.text)) {
          this.unsubscribeCmd(msg);
        } else if (/\/help/.test(msg.text)) {
          this.helpCmd(msg);
        } else {
          // If channel is not subscribed yet, subscribe
          if (!this.channelIdExists(msg.chat.id.toString())) {
            this.subscribeCmd(msg);
          }
        }
      } catch (e) {
        logs.error(`Error on TelegramBot message handler: ${msg.text}`, e);
      }
    });
  }

  /**
   * Add channel ID
   */
  private async subscribeCmd(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const message =
      formatTelegramCommandHeader("Success") + "Succesfully saved channel ID";

    this.addChannelId(chatId);

    await this.sendMessage(chatId, message, messageOptions);
  }

  /**
   * Remove channel ID
   */
  private async unsubscribeCmd(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    let message = "";
    if (this.channelIdExists(chatId)) {
      this.removeChannelId(chatId);

      message =
        formatTelegramCommandHeader("Success") +
        "Succesfully removed channel ID";
    } else {
      message = formatTelegramCommandHeader("Fail") + "Channel ID not found";
    }

    await this.sendMessage(chatId, message, messageOptions);
  }

  /**
   * Print help
   */
  private async helpCmd(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const message = [
      bold("Commands"),
      bold("/unsubscribe"),
      bold("/help"),
      `More information ${url(
        "here",
        "https://hackmd.io/iJngUGVkRMqxOEqFEjT0XA"
      )}`
    ].join("\n\n");

    await this.sendMessage(chatId, message, messageOptions);
  }

  private channelIdExists(chatId: string): boolean {
    const channelIds = db.telegramChannelIds.get();
    return channelIds.includes(chatId);
  }

  private addChannelId(channelId: string): void {
    const channelIds = db.telegramChannelIds.get();
    channelIds.push(channelId);
    db.telegramChannelIds.set(uniq(channelIds));
  }

  private removeChannelId(channelId: string): void {
    const channelIds = db.telegramChannelIds.get();
    db.telegramChannelIds.set(
      channelIds.filter(chatId => chatId !== channelId)
    );
  }
}
