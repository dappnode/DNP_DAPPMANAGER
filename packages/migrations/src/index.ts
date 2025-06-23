import { migrateUserActionLogs } from "./migrateUserActionLogs.js";
import { removeDnsAndAddAlias } from "./removeDnsAndAddAlias.js";
import { pruneUserActionLogs } from "./pruneUserActionLogs.js";
import { recreateContainersIfLegacyDns } from "./recreateContainersIfLegacyDns.js";
import { ensureCoreComposesHardcodedIpsRange } from "./ensureCoreComposesHardcodedIpsRange.js";
import { createStakerNetworkAndConnectStakerPkgs } from "./createStakerNetworkAndConnectStakerPkgs.js";
import { determineIsDappnodeAws } from "./determineIsDappnodeAws.js";
import { Consensus, Execution, MevBoost, Signer } from "@dappnode/stakers";

class MigrationError extends Error {
  errors: Error[];

  constructor(errors: Error[]) {
    super("One or more migrations failed");
    this.name = "MigrationError";
    this.errors = errors; // Retain the original error details
  }

  toString(): string {
    return `${this.name}: ${this.message}\n` + this.errors.map((err) => err.message).join("\n");
  }
}

interface Migration {
  fn: () => Promise<void>;
  migration: string;
  coreVersion: string;
}

export async function executeMigrations(
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost
): Promise<void> {
  const migrations: Migration[] = [
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
      fn: removeDnsAndAddAlias,
      migration: "add docker alias to running containers",
      coreVersion: "0.2.80"
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

  // Run migrations one after another to ensure defined order
  const migrationErrors: Error[] = [];
  for (const { fn, migration, coreVersion } of migrations) {
    try {
      await fn();
    } catch (e) {
      migrationErrors.push(new Error(`Migration ${migration} (${coreVersion}) failed: ${e}`));
    }
  }
  if (migrationErrors.length > 0) {
    throw new MigrationError(migrationErrors);
  }
}
