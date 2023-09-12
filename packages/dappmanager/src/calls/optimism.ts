import {
  OptimismConfigGet,
  OptimismConfigSet,
  UserSettings
} from "@dappnode/common";
import * as db from "../db/index.js";
import { listPackageNoThrow } from "../modules/docker/list/listPackages.js";
import {
  optimismNode,
  optimismL2Geth,
  executionClientsOptimism
} from "@dappnode/types";
import { ComposeFileEditor } from "../modules/compose/editor.js";
import { packageInstall } from "./packageInstall.js";
import {
  dockerContainerStart,
  dockerContainerStop
} from "../modules/docker/index.js";
import { packageSetEnvironment } from "./packageSetEnvironment.js";
import { packageRestartVolumes } from "./packageRestartVolumes.js";

const opNodeRpcUrlEnvName = "L1_RPC";
const opNodeServiceName = "op-node";

/**
 * Enables Optimism with the given configuration:
 *
 * - Set in db the envs
 * - Make sure install packages with userSettings: mainnetRpcUrl, enableHistorical, targetOpExecutionClient
 * - Make sure packages are running: op-node, op-geth || op-erigon, and optionally l2geth
 * - If there is a switch in the targetOpExecitonClient, and the enableHistorical has changed, then
 * the volumes of the packages should be removed
 *
 * @param mainnetRpcUrl this is the RPC url of the mainnet node that will be used to connect to the Optimism network
 * @param enableHistorical this enables the historical transactions on the Optimism network
 * @param targetOpExecutionClient this is the client that will be used to connect to the Optimism network
 */
export async function optimismConfigSet({
  mainnetRpcUrl,
  enableHistorical,
  targetOpExecutionClient
}: OptimismConfigSet): Promise<void> {
  // Set new target in db. Must go before op-node package install
  await db.opExecutionClient.set(targetOpExecutionClient);

  // op-node
  const opNodePackage = await listPackageNoThrow({ dnpName: optimismNode });
  if (!opNodePackage) {
    const userSettings: UserSettings = {
      environment: {
        [opNodeServiceName]: {
          [opNodeRpcUrlEnvName]: mainnetRpcUrl
        }
      }
    };
    // make sure op-node is installed
    await packageInstall({
      name: optimismNode,
      userSettings: { [optimismNode]: userSettings }
    });
  } else {
    // Make sure package running
    for (const container of opNodePackage.containers)
      if (!container.running)
        await dockerContainerStart(container.containerName);

    // check if the current env is the same as the new one
    const opNodeUserSettings = new ComposeFileEditor(
      optimismNode,
      false
    ).getUserSettings();

    if (
      opNodeUserSettings.environment?.[opNodeServiceName]?.[
        opNodeRpcUrlEnvName
      ] !== mainnetRpcUrl
    ) {
      await packageSetEnvironment({
        dnpName: optimismNode,
        environmentByService: {
          [opNodeServiceName]: {
            [opNodeRpcUrlEnvName]: mainnetRpcUrl
          }
        }
      });
    }
  }

  const previousHistorical = db.opEnableHistoricalRpc.get();
  await db.opEnableHistoricalRpc.set(enableHistorical);

  // op Execution clients: op-geth || op-erigon
  const targetOpExecutionClientPackage = await listPackageNoThrow({
    dnpName: targetOpExecutionClient
  });
  if (!targetOpExecutionClientPackage) {
    // make sure target package is installed
    await packageInstall({ name: targetOpExecutionClient });
  } else {
    // Remove previous volumes if historical is different
    if (previousHistorical !== enableHistorical)
      await packageRestartVolumes({ dnpName: targetOpExecutionClient });
    // Make sure target package is running
    for (const container of targetOpExecutionClientPackage.containers)
      if (!container.running)
        await dockerContainerStart(container.containerName);
  }
  // stop previous op execution clients
  const previousOpExecutionClients = executionClientsOptimism.filter(
    client => client !== targetOpExecutionClient
  );
  for (const executionClient of previousOpExecutionClients) {
    const executionClientPackage = await listPackageNoThrow({
      dnpName: executionClient
    });
    if (executionClientPackage) {
      for (const container of executionClientPackage.containers)
        if (container.running)
          await dockerContainerStop(container.containerName);
    }
  }

  // l2geth;
  const l2gethPackage = await listPackageNoThrow({
    dnpName: optimismL2Geth
  });
  if (enableHistorical) {
    // Install l2geth
    if (!l2gethPackage) {
      await packageInstall({ name: optimismL2Geth });
    } else {
      // Make sure package running
      for (const container of l2gethPackage.containers)
        if (!container.running)
          await dockerContainerStart(container.containerName);
    }
  } else {
    // Stop package
    if (l2gethPackage) {
      for (const container of l2gethPackage.containers)
        if (container.running)
          await dockerContainerStop(container.containerName);
    }
  }
}

/**
 * Returns the current Optimism configuration
 */
export async function optimismConfigGet(): Promise<OptimismConfigGet> {
  let mainnetRpcUrl = null;
  const opNodePackage = await listPackageNoThrow({ dnpName: optimismNode });

  if (opNodePackage) {
    // get rpc url from environment variable

    const userSettings = new ComposeFileEditor(
      optimismNode,
      false
    ).getUserSettings();
    mainnetRpcUrl = userSettings.environment
      ? userSettings.environment[opNodeServiceName][opNodeRpcUrlEnvName]
      : null;
  }

  return {
    mainnetRpcUrl,
    currentOpExecutionClient: db.opExecutionClient.get()
  };
}

/**
 * Disables Optimism by stopping the packages envolved
 */
export async function optimismDisable(): Promise<void> {
  // op-node
  const opNodePackage = await listPackageNoThrow({ dnpName: optimismNode });
  if (opNodePackage) {
    // Stop package
    for (const container of opNodePackage.containers)
      if (container.running) await dockerContainerStop(container.containerName);
  }

  // op Execution clients: op-geth || op-erigon
  const currentOpExecutionClient = db.opExecutionClient.get();
  if (currentOpExecutionClient) {
    const currentOpExecutionClientPackage = await listPackageNoThrow({
      dnpName: currentOpExecutionClient
    });
    if (currentOpExecutionClientPackage) {
      // Stop package
      for (const container of currentOpExecutionClientPackage.containers)
        if (container.running)
          await dockerContainerStop(container.containerName);
    }
  }

  // l2geth;
  const l2gethPackage = await listPackageNoThrow({
    dnpName: optimismL2Geth
  });
  if (l2gethPackage) {
    // Stop package
    for (const container of l2gethPackage.containers)
      if (container.running) await dockerContainerStop(container.containerName);
  }
}
