import { migrateUserActionLogs } from "./migrateUserActionLogs.js";
import { removeLegacyDockerAssets } from "./removeLegacyDockerAssets.js";
import { removeDnsAndAddAlias } from "./removeDnsAndAddAlias.js";
import { pruneUserActionLogs } from "./pruneUserActionLogs.js";
import { migrateDockerNetworkIpRange } from "./migrateDockerNetworkIpRange/index.js";
import { recreateContainersIfLegacyDns } from "./recreateContainersIfLegacyDns.js";
import { ensureCoreComposesHardcodedIpsRange } from "./ensureCoreComposesHardcodedIpsRange.js";
import { addDappnodePeerToLocalIpfsNode } from "./addDappnodePeerToLocalIpfsNode.js";
import { params } from "@dappnode/params";
import { changeEthicalMetricsDbFormat } from "./changeEthicalMetricsDbFormat.js";
import { createStakerNetworkAndConnectStakerPkgs } from "./createStakerNetworkAndConnectStakerPkgs.js";
import { determineIsDappnodeAws } from "./determineIsDappnodeAws.js";
import { Consensus, Execution, MevBoost, Signer } from "@dappnode/stakers";

/**
 * Executes migrations required for the current DAppNode core version.
 */
export async function executeMigrations(
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost
): Promise<void> {
  const migrationErrors = [];

  const migrations = [
    {
      fn: removeLegacyDockerAssets,
      migration: "bundle legacy ops to prevent spamming the docker API",
      coreVersion: "0.2.30"
    },
    {
      fn: migrateUserActionLogs,
      migration: "migrate winston .log JSON file to a lowdb",
      coreVersion: "0.2.30"
    },
    {
      fn: pruneUserActionLogs,
      migration: "prune user action logs if the size is greater than 4 MB",
      coreVersion: "0.2.59"
    },
    {
      fn: ensureCoreComposesHardcodedIpsRange,
      migration: "ensure core composes files has correct hardcoded IPs in range",
      coreVersion: "0.2.85"
    },
    {
      fn: recreateContainersIfLegacyDns,
      migration: "remove legacy dns from running containers",
      coreVersion: "0.2.85"
    },
    {
      fn: () =>
        migrateDockerNetworkIpRange({
          dockerNetworkName: params.DOCKER_PRIVATE_NETWORK_NAME,
          dockerNetworkSubnet: params.DOCKER_NETWORK_SUBNET,
          dappmanagerContainer: {
            name: params.dappmanagerContainerName,
            ip: params.DAPPMANAGER_IP
          },
          bindContainer: { name: params.bindContainerName, ip: params.BIND_IP }
        }),
      migration: "ensure docker network configuration",
      coreVersion: "0.2.85"
    },
    {
      fn: removeDnsAndAddAlias,
      migration: "add docker alias to running containers",
      coreVersion: "0.2.80"
    },
    {
      fn: addDappnodePeerToLocalIpfsNode,
      migration: "add Dappnode peer to local IPFS node",
      coreVersion: "0.2.88"
    },
    {
      fn: changeEthicalMetricsDbFormat,
      migration: "change ethical metrics db format",
      coreVersion: "0.2.92"
    },
    {
      fn: determineIsDappnodeAws,
      migration: "determine if the dappnode is running in Dappnode AWS",
      coreVersion: "0.2.94"
    },
    {
      fn: () => createStakerNetworkAndConnectStakerPkgs(execution, consensus, signer, mevBoost),
      migration: "create docker staker network and persist selected staker pkgs per network",
      coreVersion: "0.2.95"
    }
  ];

  for (const { fn, migration, coreVersion } of migrations) {
    try {
      await fn();
    } catch (e) {
      migrationErrors.push(new Error(`Migration ${migration} (${coreVersion}) failed: ${e.message}`));
    }
  }

  if (migrationErrors.length > 0) {
    throw new AggregateError(migrationErrors, "One or more migrations failed");
  }
}
