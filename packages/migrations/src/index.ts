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
import { createStakerNetworkAndConnectStakerPkgs } from "./createStakerNetworkAndConnectStakerPkgs.js";
import { determineIsDappnodeAws } from "./determineIsDappnodeAws.js";
import { Consensus, Execution, MevBoost, Signer } from "@dappnode/stakers";
import { removeBannedRelays } from "./removeBannedRelays.js";

export class MigrationError extends Error {
  migration: string;
  coreVersion: string;
  constructor(migration: string, coreVersion: string) {
    super();
    this.migration = migration;
    this.coreVersion = coreVersion;
    super.message = `Migration ${migration} ${coreVersion} failed: ${super.message}`;
  }
}

/**
 * Executes migrations required for the current DAppNode core version.
 */
export async function executeMigrations(
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost
): Promise<void> {
  const migrationErrors: MigrationError[] = [];

  await removeLegacyDockerAssets().catch((e) =>
    migrationErrors.push({
      migration: "bundle legacy ops to prevent spamming the docker API",
      coreVersion: "0.2.30",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await migrateUserActionLogs().catch((e) =>
    migrationErrors.push({
      migration: "migrate winston .log JSON file to a lowdb",
      coreVersion: "0.2.30",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await pruneUserActionLogs().catch((e) =>
    migrationErrors.push({
      migration: "prune user action logs if the size is greater than 4 MB",
      coreVersion: "0.2.59",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await removeDnsFromComposeFiles().catch((e) =>
    migrationErrors.push({
      migration: "remove bind DNS from docker compose files",
      coreVersion: "0.2.82",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await ensureCoreComposesHardcodedIpsRange().catch((e) =>
    migrationErrors.push({
      migration: "ensure core composes files has correct hardcoded IPs in range",
      coreVersion: "0.2.85",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await recreateContainersIfLegacyDns().catch((e) =>
    migrationErrors.push({
      migration: "remove legacy dns from running containers",
      coreVersion: "0.2.85",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await migrateDockerNetworkIpRange({
    dockerNetworkName: params.DOCKER_PRIVATE_NETWORK_NAME,
    dockerNetworkSubnet: params.DOCKER_NETWORK_SUBNET,
    dappmanagerContainer: {
      name: params.dappmanagerContainerName,
      ip: params.DAPPMANAGER_IP
    },
    bindContainer: { name: params.bindContainerName, ip: params.BIND_IP }
  }).catch((e) =>
    migrationErrors.push({
      migration: "ensure docker network configuration",
      coreVersion: "0.2.85",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await addAliasToRunningContainers().catch((e) =>
    migrationErrors.push({
      migration: "add docker alias to running containers",
      coreVersion: "0.2.80",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await addDappnodePeerToLocalIpfsNode().catch((e) =>
    migrationErrors.push({
      migration: "add Dappnode peer to local IPFS node",
      coreVersion: "0.2.88",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await changeEthicalMetricsDbFormat().catch((e) =>
    migrationErrors.push({
      migration: "change ethical metrics db format",
      coreVersion: "0.2.92",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await determineIsDappnodeAws().catch((e) =>
    migrationErrors.push({
      migration: "determine if the dappnode is running in Dappnode AWS",
      coreVersion: "0.2.94",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await createStakerNetworkAndConnectStakerPkgs(execution, consensus, signer, mevBoost).catch((e) =>
    migrationErrors.push({
      migration: "create docker staker network and persist selected staker pkgs per network",
      coreVersion: "0.2.95",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  await removeBannedRelays(mevBoost).catch((e) =>
    migrationErrors.push({
      migration: "remove banned relays from the mevboost package",
      coreVersion: "0.2.99",
      name: "MIGRATION_ERROR",
      message: e
    })
  );

  if (migrationErrors.length > 0) throw migrationErrors;
}
