import { migrateUserActionLogs } from "./migrateUserActionLogs.js";
import { removeLegacyDockerAssets } from "./removeLegacyDockerAssets.js";
import { addAliasToRunningContainers } from "./addAliasToRunningContainers.js";
import { switchEthClientIfOpenethereumOrGethLight } from "./switchEthClientIfOpenethereumOrGethLight.js";
import { pruneUserActionLogs } from "./pruneUserActionLogs.js";
import { setDefaultEthicalMetricsEmail } from "./setDefaultEthicalMetricsEmail.js";
import { removeDnsFromComposeFiles } from "./removeDnsFromComposeFiles.js";
import { ensureDockerNetworkConfig } from "./ensureDockerNetworkConfig/index.js";
import { recreateContainersIfLegacyDns } from "./recreateContainersIfLegacyDns.js";
import { ensureCoreComposesHardcodedIpsRange } from "./ensureCoreComposesHardcodedIpsRange.js";

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

  await removeLegacyDockerAssets().catch((e) =>
    migrationErrors.push({
      migration: "bundle legacy ops to prevent spamming the docker API",
      coreVersion: "0.2.30",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await migrateUserActionLogs().catch((e) =>
    migrationErrors.push({
      migration: "migrate winston .log JSON file to a lowdb",
      coreVersion: "0.2.30",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await switchEthClientIfOpenethereumOrGethLight().catch((e) =>
    migrationErrors.push({
      migration:
        "switch client if the current selected is geth-light or openethereum",
      coreVersion: "0.2.58",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await pruneUserActionLogs().catch((e) =>
    migrationErrors.push({
      migration: "prune user action logs if the size is greater than 4 MB",
      coreVersion: "0.2.59",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await setDefaultEthicalMetricsEmail().catch((e) =>
    migrationErrors.push({
      migration:
        "set default email for ethical metrics if the package is installed",
      coreVersion: "0.2.77",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await removeDnsFromComposeFiles().catch((e) =>
    migrationErrors.push({
      migration: "remove bind DNS from docker compose files",
      coreVersion: "0.2.82",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await ensureCoreComposesHardcodedIpsRange().catch((e) =>
    migrationErrors.push({
      migration:
        "ensure core composes files has correct hardcoded IPs in range",
      coreVersion: "0.2.85",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await recreateContainersIfLegacyDns().catch((e) =>
    migrationErrors.push({
      migration: "remove legacy dns from running containers",
      coreVersion: "0.2.85",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await ensureDockerNetworkConfig().catch((e) =>
    migrationErrors.push({
      migration: "ensure docker network configuration",
      coreVersion: "0.2.85",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await addAliasToRunningContainers().catch((e) =>
    migrationErrors.push({
      migration: "add docker alias to running containers",
      coreVersion: "0.2.80",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  if (migrationErrors.length > 0) throw migrationErrors;
}
