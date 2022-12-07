import { dbCache, dbMain } from "./dbFactory";
import { PackageVersionData } from "../types";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";
import { dbKeys } from "./dbUtils";

export const serverName = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(dbKeys.SERVER_NAME, ""),
  "SERVER_NAME"
);

// Domains

export const fullnodeDomainTarget = dbMain.staticKey<string>(
  dbKeys.FULLNODE_DOMAIN_TARGET,
  ""
);

// Host password check

export const passwordIsSecure = dbMain.staticKey<boolean>(
  dbKeys.PASSWORD_IS_SECURE,
  false
);

// Telegram bot status

export const telegramStatus = dbMain.staticKey<boolean>(
  dbKeys.TELEGRAM_STATUS,
  false
);

// Telegram token

export const telegramToken = dbMain.staticKey<string | null>(
  dbKeys.TELEGRAM_TOKEN,
  null
);

// Telegram channel Id

export const telegramChannelIds = dbMain.staticKey<string[]>(
  dbKeys.TELEGRAM_CHANNEL_ID,
  []
);

// Cache version information to detect updates

export const versionData = dbCache.staticKey<PackageVersionData>(
  dbKeys.VERSION_DATA,
  {}
);

// Disk usage threshould records

export const diskUsageThreshold = dbCache.indexedByKey<boolean, string>({
  rootKey: dbKeys.DISK_USAGE_THRESHOLD,
  getKey: id => id
});

// DAppNode Name appears on the UI

export const dappnodeWebName = dbMain.staticKey<string>(
  dbKeys.DAPPNODE_WEB_NAME,
  ""
);
