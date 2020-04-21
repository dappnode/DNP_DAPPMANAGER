import { staticKey } from "./dbMain";

const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";
const LAST_POST_CORE_UPDATE_RESTART = "last-post-core-update-restart";

export const importedInstallationStaticIp = staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = staticKey<boolean>(IS_VPN_DB_MIGRATED, false);

export const lastPostCoreUpdateRestart = staticKey<number>(
  LAST_POST_CORE_UPDATE_RESTART,
  0
);
