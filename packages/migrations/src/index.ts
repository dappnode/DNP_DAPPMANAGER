import { migrateUserActionLogs } from "./migrateUserActionLogs.js";
import { removeLegacyDockerAssets } from "./removeLegacyDockerAssets.js";
import { addAliasToRunningContainers } from "./addAliasToRunningContainers.js";
import { pruneUserActionLogs } from "./pruneUserActionLogs.js";
import { removeDnsFromComposeFiles } from "./removeDnsFromComposeFiles.js";
import { migrateDockerNetworkIpRange } from "./migrateDockerNetworkIpRange/index.js";
import { recreateContainersIfLegacyDns } from "./recreateContainersIfLegacyDns.js";
import { ensureCoreComposesHardcodedIpsRange } from "./ensureCoreComposesHardcodedIpsRange.js";
import { addDappnodePeerToLocalIpfsNode } from "./addDappnodePeerToLocalIpfsNode.js";
import { params } from "@dappnode/params";
import { changeEthicalMetricsDbFormat } from "./changeEthicalMetricsDbFormat.js";
import { determineIsDappnodeCloud } from "./determineIsDappnodeCloud.js";

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

  await pruneUserActionLogs().catch((e) =>
    migrationErrors.push({
      migration: "prune user action logs if the size is greater than 4 MB",
      coreVersion: "0.2.59",
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

  await migrateDockerNetworkIpRange({
    dockerNetworkName: params.DOCKER_PRIVATE_NETWORK_NAME,
    dockerNetworkSubnet: params.DOCKER_NETWORK_SUBNET,
    dappmanagerContainer: {
      name: params.dappmanagerContainerName,
      ip: params.DAPPMANAGER_IP,
    },
    bindContainer: { name: params.bindContainerName, ip: params.BIND_IP },
  }).catch((e) =>
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

  await addDappnodePeerToLocalIpfsNode().catch((e) =>
    migrationErrors.push({
      migration: "add Dappnode peer to local IPFS node",
      coreVersion: "0.2.88",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await changeEthicalMetricsDbFormat().catch((e) =>
    migrationErrors.push({
      migration: "change ethical metrics db format",
      coreVersion: "0.2.92",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  await determineIsDappnodeCloud().catch((e) =>
    migrationErrors.push({
      migration: "determine if the node is running in Dappnode Cloud",
      coreVersion: "0.2.93",
      name: "MIGRATION_ERROR",
      message: e.message,
      stack: e.stack,
    })
  );

  if (migrationErrors.length > 0) throw migrationErrors;
}
