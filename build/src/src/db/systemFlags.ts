import { staticKey } from "./dbMain";

const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";
const UI_WELCOME_DONE = "UI_WELCOME_DONE";

export const importedInstallationStaticIp = staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = staticKey<boolean>(IS_VPN_DB_MIGRATED, false);

export const uiWelcomeDone = staticKey<boolean>(UI_WELCOME_DONE, false);
