import { OptimismConfigSet, UserSettings } from "@dappnode/common";
import * as db from "../../db/index.js";
import { listPackageNoThrow } from "../docker/list/listPackages.js";
import {
  optimismNode,
  optimismL2Geth,
  executionClientsOptimism
} from "@dappnode/types";
import { ComposeFileEditor } from "../compose/editor.js";
import { packageInstall } from "../../calls/packageInstall.js";
import { dockerContainerStart, dockerContainerStop } from "../docker/index.js";
import { packageSetEnvironment } from "../../calls/packageSetEnvironment.js";
import { opNodeServiceName, opNodeRpcUrlEnvName } from "./params.js";

export async function setOptimismConfig({
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

  //const previousHistorical = db.opEnableHistoricalRpc.get();
  await db.opEnableHistoricalRpc.set(enableHistorical);

  // op Execution clients: op-geth || op-erigon
  const targetOpExecutionClientPackage = await listPackageNoThrow({
    dnpName: targetOpExecutionClient
  });
  if (!targetOpExecutionClientPackage) {
    // make sure target package is installed
    await packageInstall({ name: targetOpExecutionClient });
  } else {
    // TODO: Remove previous volumes if historical is different (danger removing volumes is too intrusives)
    /**if (previousHistorical !== enableHistorical)
      await packageRestartVolumes({ dnpName: targetOpExecutionClient });*/
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
