import { migrateUserActionLogs } from "./migrateUserActionLogs.js";
import { removeLegacyDockerAssets } from "./removeLegacyDockerAssets.js";
import { addAliasToRunningContainers } from "./addAliasToRunningContainers.js";
import { switchEthClientIfOpenethereumOrGethLight } from "./switchEthClientIfOpenethereumOrGethLight.js";
import { pruneUserActionLogs } from "./pruneUserActionLogs.js";
import { setDefaultFeeRecipient } from "./setDefaultFeeRecipient.js";

export class MigrationError extends Error {
  migration: string;
  coreVersion: string;
  constructor(migration: string, coreVersion: string) {
    super();
    this.migration = migration;
    this.coreVersion = coreVersion;
    super.message = `Migration ${migration} ${coreVersion} failed: ${
      super.message
    }`;
  }
}

/**
 * Executes migrations required for the current DAppNode core version.
 */
export async function executeMigrations(): Promise<void> {
  const migrationErrors: MigrationError[] = [];

  removeLegacyDockerAssets().catch(e =>
    migrationErrors.push({
      migration: "bundle legacy ops to prevent spamming the docker API",
      coreVersion: "0.2.30",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack
    })
  );

  migrateUserActionLogs().catch(e =>
    migrationErrors.push({
      migration: "migrate winston .log JSON file to a lowdb",
      coreVersion: "0.2.30",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack
    })
  );

  addAliasToRunningContainers().catch(e =>
    migrationErrors.push({
      migration: "add docker alias to running containers",
      coreVersion: "0.2.38",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack
    })
  );

  switchEthClientIfOpenethereumOrGethLight().catch(e =>
    migrationErrors.push({
      migration:
        "switch client if the current selected is geth-light or openethereum",
      coreVersion: "0.2.58",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack
    })
  );

  pruneUserActionLogs().catch(e =>
    migrationErrors.push({
      migration: "prune user action logs if the size is greater than 4 MB",
      coreVersion: "0.2.59",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack
    })
  );

  setDefaultFeeRecipient().catch(e =>
    migrationErrors.push({
      migration: "set default fee recipient",
      coreVersion: "0.2.67",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack
    })
  );

  if (migrationErrors.length > 0) throw migrationErrors;
}
