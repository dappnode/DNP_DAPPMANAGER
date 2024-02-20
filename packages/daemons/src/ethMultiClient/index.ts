import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import {
  runAtMostEvery,
  runOnlyOneSequentially,
  getConsensusUserSettings,
} from "@dappnode/utils";
import { logs } from "@dappnode/logger";
import {
  EthClientRemote,
  EthProviderError,
  EthClientInstallStatus,
  ExecutionClientMainnet,
  ConsensusClientMainnet,
} from "@dappnode/types";
import {
  ethereumClient,
  getLocalFallbackContentHash,
  isExecClient,
  isConsClient,
  serializeError,
  packageInstall,
  DappnodeInstaller,
} from "@dappnode/installer";
import {
  dockerComposeUpPackage,
  listPackageNoThrow,
} from "@dappnode/dockerapi";

/**
 * Check status of the Ethereum client and do next actions
 * This function should be run:
 * - every interval
 * - after changing the client
 * - after completing a run if the status has changed
 *
 * This architecture is used for debuggability and to be fail-safe
 * At any point the client can query the DB and see clear status
 * It makes it easier to know what will happen next given a status
 * It also retries each step automatically without added logic
 */
export async function runEthClientInstaller(
  dappnodeInstaller: DappnodeInstaller,
  target: ExecutionClientMainnet | ConsensusClientMainnet | "remote",
  status?: EthClientInstallStatus,
  useCheckpointSync?: boolean
): Promise<EthClientInstallStatus | null> {
  // Re-check just in case, on run the installer for local target clients
  if (target === "remote") return null;

  if (!target) throw Error(`No client data for target: ${target}`);
  const dnp = await listPackageNoThrow({ dnpName: target });

  if (dnp) {
    // OK: Client is already installed, ensure it's running
    if (dnp.containers.some((c) => !c.running))
      await dockerComposeUpPackage({ dnpName: target }, {}, {}, true);
    return { status: "INSTALLED" };
  } else {
    // Client is not installed

    switch (status?.status || "TO_INSTALL") {
      case "INSTALLING":
        // NOTE: This status has to be verified on DAPPMANAGER startup. Otherwise it can
        // stay in installing state forever if the dappmanager resets during the installation
        return null;

      case "TO_INSTALL":
      case "INSTALLING_ERROR":
        // OK: Expected state, run / retry installation
        try {
          if (isExecClient(target))
            db.ethExecClientInstallStatus.set(
              target as ExecutionClientMainnet,
              { status: "INSTALLING" }
            );
          else if (isConsClient(target))
            db.ethConsClientInstallStatus.set(
              target as ConsensusClientMainnet,
              { status: "INSTALLING" }
            );

          try {
            if (isConsClient(target))
              await packageInstall(dappnodeInstaller, {
                name: target,
                userSettings: getConsensusUserSettings({
                  dnpName: target,
                  network: "mainnet",
                  useCheckpointSync,
                }),
              });
            else await packageInstall(dappnodeInstaller, { name: target });
          } catch (e) {
            // When installing DAppNode for the first time, if the user selects a
            // non-remote target and disabled fallback, there must be a way to
            // install the client package without access to an Eth node. This try / catch
            // covers this case by re-trying the installation with a locally available
            // IPFS content hash for all target packages
            if (e instanceof EthProviderError) {
              const contentHash = getLocalFallbackContentHash(target);
              if (!contentHash) throw Error(`No local version for ${target}`);
              await packageInstall(dappnodeInstaller, {
                name: target,
                version: contentHash,
              });
            } else {
              throw e;
            }
          }

          return { status: "INSTALLED" };
        } catch (e) {
          return { status: "INSTALLING_ERROR", error: serializeError(e) };
        }

      case "INSTALLED":
        // NOT-OK: Client should be installed
        // Something or someone removed the client, re-install?
        return null;

      case "UNINSTALLED":
        // OK: Client should be un-installed and is uninstalled
        return null;
    }
  }
}

/**
 * Reset status if == INSTALLING, it has to be verified
 * Otherwise it can stay in installing state forever if the dappmanager
 * resets during an installation of the client
 */
function verifyInitialStatusIsNotInstalling(): void {
  const execClient = db.executionClientMainnet.get();
  if (execClient) {
    const status = db.ethExecClientInstallStatus.get(execClient);
    if (status && status.status === "INSTALLING") {
      db.ethExecClientInstallStatus.set(execClient, { status: "TO_INSTALL" });
    }
  }

  const consClient = db.consensusClientMainnet.get();
  if (consClient) {
    const status = db.ethConsClientInstallStatus.get(consClient);
    if (status && status.status === "INSTALLING") {
      db.ethConsClientInstallStatus.set(consClient, { status: "TO_INSTALL" });
    }
  }
}

/**
 * Eth multi-client daemon. Handles ETH client switching logic
 * Must run:
 * - every interval
 * - after changing the client
 * - after completing a run if the status has changed
 */
export function startEthMultiClientDaemon(
  dappnodeInstaller: DappnodeInstaller,
  signal: AbortSignal
): void {
  verifyInitialStatusIsNotInstalling();

  const runEthMultiClientTaskMemo = runOnlyOneSequentially(
    async (
      multiClientArgs:
        | {
            useCheckpointSync?: boolean;
            prevExecClientDnpName?: ExecutionClientMainnet;
          }
        | undefined
    ) => {
      try {
        const execClient = db.executionClientMainnet.get();
        const consClient = db.consensusClientMainnet.get();

        if (
          db.ethClientRemote.get() === EthClientRemote.on ||
          !execClient ||
          !consClient
        )
          return; // Nothing to install

        for (const client of [execClient, consClient]) {
          if (!client) continue;

          const prev = isExecClient(client)
            ? db.ethExecClientInstallStatus.get(client)
            : db.ethConsClientInstallStatus.get(client);
          const next = await runEthClientInstaller(
            dappnodeInstaller,
            client,
            prev,
            multiClientArgs?.useCheckpointSync
          );

          if (!next) continue; // Package is uninstalled
          isExecClient(client)
            ? db.ethExecClientInstallStatus.set(execClient, next)
            : db.ethConsClientInstallStatus.set(consClient, next);

          if (!prev || prev.status !== next.status) {
            // Next run MUST be defered to next event loop for prevStatus to refresh
            setTimeout(eventBus.runEthClientInstaller.emit, 1000);

            if (isExecClient(client) && next.status === "INSTALLED") {
              // If status switched to "INSTALLED", map to fullnode.dappnode
              // Must be done here in case the package is already installed
              // 1. Domain for BIND package
              db.fullnodeDomainTarget.set(execClient);
              // 2. Add network alias for docker DNS
              ethereumClient.updateFullnodeAlias({
                prevExecClientDnpName: multiClientArgs?.prevExecClientDnpName,
                newExecClientDnpName: client,
                network: "mainnet",
              });
            }
          }
        }
      } catch (e) {
        logs.error("Error on eth client installer daemon", e);
      }
    }
  );

  // Subscribe with a throttle to run only one time at once
  eventBus.runEthClientInstaller.on(
    ({ useCheckpointSync, prevExecClientDnpName }) =>
      runEthMultiClientTaskMemo({ useCheckpointSync, prevExecClientDnpName })
  );

  runAtMostEvery(
    async () => runEthMultiClientTaskMemo(),
    params.AUTO_UPDATE_DAEMON_INTERVAL,
    signal
  );
}
