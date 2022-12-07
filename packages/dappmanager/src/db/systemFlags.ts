import { dbMain } from "./dbFactory";
import { dbKeys } from "./dbUtils";

export const importedInstallationStaticIp = dbMain.staticKey<boolean>(
  dbKeys.IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = dbMain.staticKey<boolean>(
  dbKeys.IS_VPN_DB_MIGRATED,
  false
);
