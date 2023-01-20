import { dbMain } from "./dbFactory.js";

const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";

export const importedInstallationStaticIp = dbMain.staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = dbMain.staticKey<boolean>(
  IS_VPN_DB_MIGRATED,
  false
);
