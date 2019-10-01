import { staticKey } from "./lowLevelDb";

const ARE_ENV_FILES_MIGRATED = "are-env-files-migrated";
const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";

export const areEnvFilesMigrated = staticKey<boolean>(
  ARE_ENV_FILES_MIGRATED,
  false
);

export const importedInstallationStaticIp = staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = staticKey<boolean>(IS_VPN_DB_MIGRATED, false);
