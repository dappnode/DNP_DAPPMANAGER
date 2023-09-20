import { InstalledPackageData, OptimismConfigSet, UserSettings } from "@dappnode/common";
import * as db from "../../db/index.js";
import { listPackageNoThrow } from "../docker/list/listPackages.js";
import {
  optimismNode,
  optimismL2Geth,
  executionClientsOptimism,
  ExecutionClientOptimism
} from "@dappnode/types";
import { ComposeFileEditor } from "../compose/editor.js";
import { packageInstall } from "../../calls/packageInstall.js";
import { dockerContainerStart, dockerContainerStop } from "../docker/index.js";
import { packageSetEnvironment } from "../../calls/packageSetEnvironment.js";
import { opNodeServiceName, opNodeRpcUrlEnvName, historicalRpcUrl, opExecutionClientHistoricalRpcUrlEnvName, opClientToServiceMap } from "./params.js";

export async function setOptimismConfig({
  archive,
  executionClient,
  rollup
}: OptimismConfigSet): Promise<void> {
  // l2geth;
  const l2gethPackage = await listPackageNoThrow({
    dnpName: optimismL2Geth
  });

  if (archive) {
    // Install l2geth
    if (!l2gethPackage) {
      await packageInstall({ name: optimismL2Geth });
    } else {
      await startAllContainers(l2gethPackage);
    }
    if (db.opEnableHistoricalRpc.get() !== true)
      await db.opEnableHistoricalRpc.set(true);
  } else {
    if (l2gethPackage)
      await stopAllContainers([l2gethPackage]);

    if (db.opEnableHistoricalRpc.get() !== false)
      await db.opEnableHistoricalRpc.set(false);
  }

  // op Execution clients: op-geth || op-erigon
  if (executionClient) {
    const targetOpExecutionClientPackage = await listPackageNoThrow({
      dnpName: executionClient.dnpName
    });

    const userSettings: UserSettings = {
      environment: {
        [opClientToServiceMap[executionClient.dnpName]]: {
          [opExecutionClientHistoricalRpcUrlEnvName]: historicalRpcUrl // TODO: Empty if not archive?
        }
      }
    };

    if (!targetOpExecutionClientPackage) {

      // make sure target package is installed
      await packageInstall({
        name: executionClient.dnpName,
        userSettings: { [executionClient.dnpName]: userSettings }
      });
    } else {
      await packageSetEnvironment({
        dnpName: executionClient.dnpName,
        environmentByService: userSettings.environment ? userSettings.environment : {}
      });

      await startAllContainers(targetOpExecutionClientPackage);

    }

    await stopOtherOpExecutionClients(executionClient.dnpName);

  } else {
    // stop all op execution clients
    await stopPkgsByDnpNames([...executionClientsOptimism]);
  }

  // Set new target in db. Must go before op-node package install
  await db.opExecutionClient.set(executionClient?.dnpName);

  // op-node
  const opNodePackage = await listPackageNoThrow({ dnpName: optimismNode });
  if (rollup) {
    if (!opNodePackage) {
      const userSettings: UserSettings = {
        environment: {
          [opNodeServiceName]: {
            [opNodeRpcUrlEnvName]: rollup.mainnetRpcUrl
          }
        }
      };
      // make sure op-node is installed
      await packageInstall({
        name: optimismNode,
        userSettings: { [optimismNode]: userSettings }
      });
    } else {

      await startAllContainers(opNodePackage);

      // check if the current env is the same as the new one
      const opNodeUserSettings = new ComposeFileEditor(
        optimismNode,
        false
      ).getUserSettings();

      if (
        opNodeUserSettings.environment?.[opNodeServiceName]?.[
        opNodeRpcUrlEnvName
        ] !== rollup.mainnetRpcUrl
      ) {
        await packageSetEnvironment({
          dnpName: optimismNode,
          environmentByService: {
            [opNodeServiceName]: {
              [opNodeRpcUrlEnvName]: rollup.mainnetRpcUrl
            }
          }
        });
      }
    }
  } else {
    if (opNodePackage)
      await stopAllContainers([opNodePackage]);
  }
}

async function stopOtherOpExecutionClients(
  executionClient: ExecutionClientOptimism
): Promise<void> {
  const otherOpExecutionClientDnps = executionClientsOptimism.filter(
    client => client !== executionClient
  );

  await stopPkgsByDnpNames(otherOpExecutionClientDnps);
}

async function stopPkgsByDnpNames(
  dnpNames: ExecutionClientOptimism[]
) {
  const pkgs: (InstalledPackageData | null)[] = await Promise.all(
    dnpNames.map(async dnpName => {
      return await listPackageNoThrow({ dnpName });
    })
  );

  // Remove null values
  await stopAllContainers(pkgs.filter(Boolean) as InstalledPackageData[]);
}

async function stopAllContainers(pkgs: InstalledPackageData[]): Promise<void> {
  for (const pkg of pkgs)
    for (const container of pkg.containers)
      if (container.running) await dockerContainerStop(container.containerName);
}

async function startAllContainers(pkg: InstalledPackageData): Promise<void> {
  for (const container of pkg.containers)
    if (!container.running)
      await dockerContainerStart(container.containerName);
}