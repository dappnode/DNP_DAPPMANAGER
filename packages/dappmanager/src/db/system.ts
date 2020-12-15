import * as dbMain from "./dbMain";
import * as dbCache from "./dbCache";
import { PackageVersionData } from "../types";

const SERVER_NAME = "server-name";
const FULLNODE_DOMAIN_TARGET = "fullnode-domain-target";
const PASSWORD_IS_SECURE = "password-is-secure";
const VERSION_DATA = "version-data";
const TELEGRAM_STATUS = "telegram-status";
const TELEGRAM_TOKEN = "telegram-token";
const TELEGRAM_CHANNEL_ID = "telegram-channel-id";

export const serverName = dbMain.staticKey<string>(SERVER_NAME, "");

// Domains

export const fullnodeDomainTarget = dbMain.staticKey<string>(
  FULLNODE_DOMAIN_TARGET,
  ""
);

// Host password check

export const passwordIsSecure = dbMain.staticKey<boolean>(
  PASSWORD_IS_SECURE,
  false
);

// Telegram bot status

export const telegramStatus = dbMain.staticKey<boolean>(TELEGRAM_STATUS, false);

// Telegram token

export const telegramToken = dbMain.staticKey<string | null>(
  TELEGRAM_TOKEN,
  null
);

// Telegram channel Id

export const telegramChannelId = dbMain.staticKey<string | number | null>(
  TELEGRAM_CHANNEL_ID,
  null
);

// Cache version information to detect updates

export const versionData = dbCache.staticKey<PackageVersionData>(
  VERSION_DATA,
  {}
);
