import * as dbMain from "./dbMain";
import * as dbCache from "./dbCache";
import { PackageVersionData } from "../types";

const SERVER_NAME = "server-name";
const FULLNODE_DOMAIN_TARGET = "fullnode-domain-target";
const PASSWORD_IS_SECURE = "password-is-secure";
const VERSION_DATA = "version-data";

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

// Cache version information to detect updates

export const versionData = dbCache.staticKey<PackageVersionData>(
  VERSION_DATA,
  {}
);
