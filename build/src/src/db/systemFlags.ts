import { staticKey } from "./lowLevelDb";

const ARE_ENV_FILES_MIGRATED = "are-env-files-migrated";
const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";

export const areEnvFilesMigrated = staticKey<boolean>(
  ARE_ENV_FILES_MIGRATED,
  false
);

export const importedInstallationStaticIp = staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);
