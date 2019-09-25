import { staticKey } from "./lowLevelDb";

const ARE_ENV_FILES_MIGRATED = "are-env-files-migrated";

export const areEnvFilesMigrated = staticKey<boolean>(
  ARE_ENV_FILES_MIGRATED,
  false
);
