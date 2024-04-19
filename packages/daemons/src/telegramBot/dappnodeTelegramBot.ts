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
interface ICommand {
  description: string;
  action:
    | "handleEnableAutoUpdates"
    | "handleDisableAutoUpdates"
    | "subscribeCmd"
    | "unsubscribeCmd"
    | "helpCmd"
    | "handleWireguardCredentials";
  requiresAuth?: boolean;
}

const COMMANDS: Record<string, ICommand> = {
  "/enable_auto_updates": {
    description: "Enable auto-updates for all packages",
    action: "handleEnableAutoUpdates",
    requiresAuth: true,
  },
  disable_auto_updates: {
    description: "Disable auto-updates for all packages",
    action: "handleDisableAutoUpdates",
    requiresAuth: true,
  },
  "/start": {
    description: "Subscribe to future notifications",
    action: "subscribeCmd",
  },
  "/unsubscribe": {
    description: "Unsubscribe from future notifications",
    action: "unsubscribeCmd",
  },
  "/help": {
    description: "Display all available commands",
    action: "helpCmd",
  },
  "/get_wireguard_credentials": {
    description: "Fetch wireguard credentials",
    action: "handleWireguardCredentials",
    requiresAuth: true,
  },
};

export class DappnodeTelegramBot {
  private bot: TelegramBot;

  constructor(telegramToken: string) {
    this.bot = new TelegramBot(telegramToken, { polling: true });
    // POLLING ERRORS
    // 1. EFATAL if error was fatal e.g. network error
    // 2. EPARSE if response body could not be parsed
    // 3. ETELEGRAM if error was returned from Telegram servers
    // ETELEGRAM: 409 Conflict  =>  More than one bot instance polling
    // ETELEGRAM: 404 Not Found => wrong token or not found
    this.bot.on("polling_error", (error) =>
      logs.error(`${error.name}: ${error.message}`)
    );
    this.bot.on("message", (msg) => this.handleMessage(msg));
  }

  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    if (!msg.text) return;

    const command = Object.keys(COMMANDS).find((cmd) =>
      msg.text?.startsWith(cmd)
    );
    if (!command) {
      await this.checkSubscription(msg);
      return;
    }

    const commandConfig = COMMANDS[command];
    if (commandConfig.requiresAuth && !this.isUserAuthorized(msg.from?.id))
      await this.sendUnauthorizedMessage(msg.chat.id);
    else {
      const actionMethod = this[commandConfig.action];
      if (actionMethod) await actionMethod.call(this, msg);
    }
  }

  // HANDLERS

  /**
   *  Fetch wireguard credentials with the default device
   */
  private async handleWireguardCredentials(
    msg: TelegramBot.Message
  ): Promise<void> {
    // default device name is dappnode_admin, see https://github.com/dappnode/DNP_WIREGUARD/blob/4a074010c98b5d3003d1c3306edcb75392b247f4/docker-compose.yml#L12
    const deviceName = msg.text?.split(" ")[1] || "dappnode_admin";
    // build url with params.WIREGUARD_API_URL and deviceName
    const url = `${params.WIREGUARD_API_URL}/${deviceName}`;
    const res = await fetch(url);
    const configRemote = await res.text();
    if (!res.ok) {
      if (res.status === 404)
        return await this.sendMessage(
          msg.chat.id,
          `Device ${deviceName} not found. Please provide a valid device name or if you have setup dappnode cloud wait for the credentials to be generated.`
        );
      else
        return await this.sendMessage(
          msg.chat.id,
          `Error fetching wireguard credentials. Please try again later.`
        );
    }

    await this.sendMessage(msg.chat.id, configRemote);
  }

  /**
   * Enable auto-updates for system and regular packages
   */
  private async handleEnableAutoUpdates(
    msg: TelegramBot.Message
  ): Promise<void> {
    editDnpSetting(true);
    editCoreSetting(true);
    await this.sendMessage(
      msg.chat.id,
      "Successfully enabled auto-updates\n\nYou can manage or disable auto-update in the Admin UI at http://my.dappnode/system/auto-updates"
    );
  }

  /**
   * Disable auto-updates for system and regular packages
   */
  private async handleDisableAutoUpdates(
    msg: TelegramBot.Message
  ): Promise<void> {
    editDnpSetting(false);
    editCoreSetting(false);
    await this.sendMessage(
      msg.chat.id,
      "Successfully disabled auto-updates\n\nYou can manage or enable auto-update in the Admin UI at http://my.dappnode/system/auto-updates"
    );
  }

  /**
   * Print help
   */
  private async helpCmd(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    const message = [
      bold("Commands"),
      ...Object.entries(COMMANDS).map(
        ([command, { description }]) => `${command} - ${description}`
      ),
    ].join("\n\n");

    await this.sendMessage(chatId, message);
  }

  // Channel ID subscription

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

  // HELPERS

  private async sendMessage(
    chatId: number | string,
    text: string
  ): Promise<void> {
    await this.bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  private isUserAuthorized(userId: number | undefined): boolean {
    return !!userId && userId.toString() === db.telegramUserId.get();
  }

  private async sendUnauthorizedMessage(
    chatId: number | string
  ): Promise<void> {
    await this.sendMessage(
      chatId,
      "Unauthorized user. Please contact the admin"
    );
  }

  private async checkSubscription(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id.toString();
    if (!this.channelIdExists(chatId)) await this.subscribeCmd(msg);
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
