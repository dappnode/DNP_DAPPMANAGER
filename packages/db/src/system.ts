import { dbCache, dbMain } from "./dbFactory.js";
import { PackageVersionData } from "@dappnode/types";
import { interceptGlobalEnvOnSet } from "./intercepGlobalEnvOnSet.js";

const SERVER_NAME = "server-name";
const FULLNODE_DOMAIN_TARGET = "fullnode-domain-target";
const PASSWORD_IS_SECURE = "password-is-secure";
const VERSION_DATA = "version-data";
const TELEGRAM_STATUS = "telegram-status";
const TELEGRAM_TOKEN = "telegram-token";
const TELEGRAM_USER_ID = "telegram-user-id";
const TELEGRAM_CHANNEL_ID = "telegram-channel-id";
const DISK_USAGE_THRESHOLD = "disk-usage-threshold";
const DAPPNODE_WEB_NAME = "dappnode-web-name";
const IS_DAPPNODE_AWS = "is-dappnode-aws";

export const serverName = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(SERVER_NAME, ""),
  Object.keys({ SERVER_NAME })[0]
);

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

export const telegramChannelIds = dbMain.staticKey<string[]>(
  TELEGRAM_CHANNEL_ID,
  []
);

// Telegram user Id i.e 1461924175

export const telegramUserId = dbMain.staticKey<string | null>(
  TELEGRAM_USER_ID,
  null
);

// Is dappnode AWS instance

export const isDappnodeAws = dbMain.staticKey<boolean | null>(
  IS_DAPPNODE_AWS,
  null
);

// Cache version information to detect updates

export const versionData = dbCache.staticKey<PackageVersionData>(
  VERSION_DATA,
  {}
);

// Disk usage threshould records

export const diskUsageThreshold = dbCache.indexedByKey<boolean, string>({
  rootKey: DISK_USAGE_THRESHOLD,
  getKey: (id) => id,
});

// DAppNode Name appears on the UI

export const dappnodeWebName = dbMain.staticKey<string>(DAPPNODE_WEB_NAME, "");
