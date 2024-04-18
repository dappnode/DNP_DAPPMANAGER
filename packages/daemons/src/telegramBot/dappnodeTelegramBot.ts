import TelegramBot from "node-telegram-bot-api";
import { uniq } from "lodash-es";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";
import { bold } from "./markdown.js";
import { editDnpSetting } from "../autoUpdates/editDnpSetting.js";
import { editCoreSetting } from "../autoUpdates/editCoreSetting.js";
import { params } from "@dappnode/params";
import { TelegramCommandMessageHeader } from "./types.js";

// Note: Telegram commands MUST NOT contain "-", only "_"
export const enableAutoUpdatesCmd = "/enable_auto_updates";
export const startCmd = "/start";
export const unsubscribeCmd = "/unsubscribe";
export const helpCmd = "/help";
export const getWireguardCredentials = "/get_wireguard_credentials";

const cmds = [
  {
    cmd: enableAutoUpdatesCmd,
    help: "Enable auto-updates for all packages",
  },
  {
    cmd: startCmd,
    help: "Subscribe to future notifications",
  },
  {
    cmd: unsubscribeCmd,
    help: "Unsubcribe from future notifications",
  },
  {
    cmd: helpCmd,
    help: "Display all available commands",
  },
  {
    cmd: helpCmd,
    help: "Display all available commands",
  },
  {
    cmd: getWireguardCredentials,
    help: "Fetch wireguard credentials",
  },
];

/**
 * Polls for commands and responds.
 * Channel ID is not needed to response to messages
 */
export class DappnodeTelegramBot {
  private bot: TelegramBot;

  constructor(telegramToken: string) {
    this.bot = new TelegramBot(telegramToken);

    // POLLING ERRORS
    // 1. EFATAL if error was fatal e.g. network error
    // 2. EPARSE if response body could not be parsed
    // 3. ETELEGRAM if error was returned from Telegram servers
    // ETELEGRAM: 409 Conflict  =>  More than one bot instance polling
    // ETELEGRAM: 404 Not Found => wrong token or not found
    this.bot.on("polling_error", (error) => {
      logs.error(`${error.name}: ${error.message}`);
    });

    // Listen for any messages. If channel ID does not exists, it saves the channel ID
    this.bot.on("message", async (msg) => {
      try {
        if (!msg.text) return;

        if (msg.text.startsWith(enableAutoUpdatesCmd)) {
          await this.enableAutoUpdatesCmd(msg);
        } else if (msg.text.startsWith(unsubscribeCmd)) {
          await this.unsubscribeCmd(msg);
        } else if (msg.text.startsWith(helpCmd)) {
          await this.helpCmd(msg);
        } else if (msg.text.startsWith(getWireguardCredentials)) {
          // IMPORTANT: verify user ID is whitelisted
          const userId = msg.from?.id;
          if (!userId) {
            logs.error("This command requires user ID authentication");
            await this.sendMessage(
              msg.chat.id.toString(),
              "This command requires user ID authentication. Set the auth user ID in your dappnode at http://my.dappnode/system/notifications"
            );
            return;
          }
          if (userId.toString() !== db.telegramUserId.get()) {
            logs.error(`Unauthorized user: ${userId}`);
            await this.sendMessage(
              msg.chat.id.toString(),
              "Unauthorized user. Please contact the admin"
            );
          } else {
            // default device https://github.com/dappnode/DNP_WIREGUARD/blob/4a074010c98b5d3003d1c3306edcb75392b247f4/docker-compose.yml#L12
            const deviceName = msg.text.split(" ")[1] || "dappnode_admin";
            logs.info(
              `Fetching wireguard credentials from device ${deviceName} for user: ${userId}`
            );
            try {
              const credentials = await this.getWireguardCredentialsCmd(
                deviceName
              );
              await this.sendMessage(msg.chat.id.toString(), credentials);
            } catch (e) {
              logs.error(`Error fetching wireguard credentials: ${e}`);
              // beauty error message for device not found
              if (e.statusCode === 404)
                e.message = `Device not found: ${deviceName}`;
              await this.sendMessage(
                msg.chat.id.toString(),
                `Error fetching wireguard credentials: ${e.message}`
              );
            }
          }
        } else {
          // If channel is not subscribed yet, subscribe
          if (!this.channelIdExists(msg.chat.id.toString())) {
            await this.subscribeCmd(msg);
          } else if (msg.text.startsWith(helpCmd)) {
            await this.sendMessage(
              msg.chat.id.toString(),
              "Already subscribed"
            );
          }
        }
      } catch (e) {
        logs.error(`Error on TelegramBot message handler: ${msg.text}`, e);
      }
    });
  }

  async start(): Promise<void> {
    await this.bot.startPolling();
  }

  async stop(): Promise<void> {
    await this.bot.stopPolling();
  }

  async sendMessage(chatId: string | number, text: string): Promise<void> {
    await this.bot.sendMessage(chatId, text, {
      parse_mode: "Markdown",
    });
  }

  // Utils

  /**
   *  Fetch wireguard credentials with the default device
   */
  private async getWireguardCredentialsCmd(
    deviceName?: string
  ): Promise<string> {
    // build url with params.WIREGUARD_API_URL and deviceName
    const url = `${params.WIREGUARD_API_URL}/${deviceName}`;
    const res = await fetch(url);
    const configRemote = await res.text();
    if (!res.ok) {
      if (res.status === 404) throw Error(`Device not found: ${configRemote}`);
      throw Error(
        `Error fetching credentials: ${res.statusText} ${configRemote}`
      );
    }

    return configRemote;
  }

  /**
   * Enable auto-updates for system and regular packages
   */
  private async enableAutoUpdatesCmd(msg: TelegramBot.Message): Promise<void> {
    editDnpSetting(true);
    editCoreSetting(true);

    const message = [
      "Successfully enabled auto-updates",
      "You can manage or disable auto-update in the Admin UI",
    ].join("\n\n");
    await this.sendMessage(msg.chat.id.toString(), message);
  }

  /**
   * Add channel ID
   */
  private async subscribeCmd(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const message =
      this.formatTelegramCommandHeader("Success") +
      "Successfully saved channel ID";

    this.addChannelId(chatId);

    await this.sendMessage(chatId, message);
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
        this.formatTelegramCommandHeader("Success") +
        "Succesfully removed channel ID";
    } else {
      message =
        this.formatTelegramCommandHeader("Fail") + "Channel ID not found";
    }

    await this.sendMessage(chatId, message);
  }

  /**
   * Print help
   */
  private async helpCmd(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const message = [
      bold("Commands"),
      cmds.map(({ cmd, help }) => `${bold(cmd)} ${help}`).join("\n"),
    ].join("\n\n");

    await this.sendMessage(chatId, message);
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
      channelIds.filter((chatId) => chatId !== channelId)
    );
  }

  /**
   * Builds the telegram command message header
   */
  private formatTelegramCommandHeader(
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
}
