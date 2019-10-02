import { staticKey } from "./dbMain";

const ARE_ENV_FILES_MIGRATED = "are-env-files-migrated";
const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";
const HAS_RESTARTED_VPN_TO_INJECT_ENVS = "has-restarted-vpn-to-inject-envs";

export const areEnvFilesMigrated = staticKey<boolean>(
  ARE_ENV_FILES_MIGRATED,
  false
);

export const importedInstallationStaticIp = staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = staticKey<boolean>(IS_VPN_DB_MIGRATED, false);

export const hasRestartedVpnToInjectEnvs = staticKey<boolean>(
  HAS_RESTARTED_VPN_TO_INJECT_ENVS,
  false
);
