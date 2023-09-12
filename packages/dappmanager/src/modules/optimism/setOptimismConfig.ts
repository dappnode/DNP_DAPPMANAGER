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
      // Make sure package running
      for (const container of l2gethPackage.containers)
        if (!container.running)
          await dockerContainerStart(container.containerName);
    }
    if (db.opEnableHistoricalRpc.get() !== true)
      await db.opEnableHistoricalRpc.set(true);
  } else {
    // Stop package
    if (l2gethPackage) {
      for (const container of l2gethPackage.containers)
        if (container.running)
          await dockerContainerStop(container.containerName);
    }
    if (db.opEnableHistoricalRpc.get() !== false)
      await db.opEnableHistoricalRpc.set(false);
  }

  // op Execution clients: op-geth || op-erigon
  if (executionClient) {
    const targetOpExecutionClientPackage = await listPackageNoThrow({
      dnpName: executionClient.dnpName
    });
    if (!targetOpExecutionClientPackage) {
      // make sure target package is installed
      await packageInstall({ name: executionClient.dnpName });
    } else {
      // Make sure target package is running
      for (const container of targetOpExecutionClientPackage.containers)
        if (!container.running)
          await dockerContainerStart(container.containerName);
    }
    // stop previous op execution clients
    const previousOpExecutionClients = executionClientsOptimism.filter(
      client => client !== executionClient.dnpName
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
  } else {
    // stop all op execution clients
    for (const executionClient of executionClientsOptimism) {
      const executionClientPackage = await listPackageNoThrow({
        dnpName: executionClient
      });
      if (executionClientPackage) {
        for (const container of executionClientPackage.containers)
          if (container.running)
            await dockerContainerStop(container.containerName);
      }
    }
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
    // Stop package
    if (opNodePackage) {
      for (const container of opNodePackage.containers)
        if (container.running)
          await dockerContainerStop(container.containerName);
    }
  }
}
