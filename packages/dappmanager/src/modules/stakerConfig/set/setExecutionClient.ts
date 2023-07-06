import {
  ExecutionClient,
  StakerItemOk,
  InstalledPackageDataApiReturn
} from "@dappnode/common";
import { packageInstall } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { listPackageNoThrow } from "../../docker/list/index.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";
import {
  ExecutionClientGnosis,
  ExecutionClientMainnet,
  ExecutionClientPrater,
  Network
} from "@dappnode/types";
import * as db from "../../../db/index.js";

export async function setExecutionClient<T extends Network>({
  network,
  currentExecutionClient,
  targetExecutionClient,
  currentExecClientPkg
}: {
  network: Network;
  currentExecutionClient?: ExecutionClient<T> | null;
  targetExecutionClient?: StakerItemOk<T, "execution">;
  currentExecClientPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  await setExecutionClientConfig({
    currentExecutionClient,
    targetExecutionClient,
    currentExecClientPkg
  });
  await setExecutionOnDb(network, targetExecutionClient?.dnpName);
}

async function setExecutionClientConfig<T extends Network>({
  currentExecutionClient,
  targetExecutionClient,
  currentExecClientPkg
}: {
  currentExecutionClient?: ExecutionClient<T> | null;
  targetExecutionClient?: StakerItemOk<T, "execution">;
  currentExecClientPkg?: InstalledPackageDataApiReturn;
}): Promise<void> {
  if (!targetExecutionClient?.dnpName && !currentExecutionClient) {
    // Stop the current execution client if no option and not currentu execution client
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (!targetExecutionClient?.dnpName && currentExecutionClient) {
    // Stop the current execution client if no target provided
    logs.info(`Not execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (targetExecutionClient?.dnpName && !currentExecutionClient) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient.dnpName
    });
    if (!targetExecClientPkg) {
      // Install new consensus client if not installed
      await packageInstall({ name: targetExecutionClient.dnpName });
    } else {
      // Start new consensus client if not running
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
    }
  } else if (
    targetExecutionClient?.dnpName &&
    targetExecutionClient.dnpName === currentExecutionClient
  ) {
    if (!currentExecClientPkg) {
      logs.info("Installing execution client " + targetExecutionClient);
      await packageInstall({ name: targetExecutionClient.dnpName });
    } else {
      await dockerComposeUpPackage(
        { dnpName: currentExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
    }
  } else if (
    targetExecutionClient &&
    targetExecutionClient.dnpName !== currentExecutionClient
  ) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient.dnpName
    });
    if (!targetExecClientPkg) {
      // Install new client if not installed
      await packageInstall({ name: targetExecutionClient.dnpName });
      // Stop old client
      if (currentExecClientPkg)
        await stopAllPkgContainers(currentExecClientPkg);
    } else {
      // Start new client
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
      // Stop old client
      if (currentExecClientPkg)
        await stopAllPkgContainers(currentExecClientPkg);
    }
  }
}

/**
 * Sets the staker configuration on db for a given network
 * IMPORTANT: check the values are different before setting them so the interceptGlobalOnSet is not called
 */
async function setExecutionOnDb<T extends Network>(
  network: T,
  executionClient?: ExecutionClient<T>
): Promise<void> {
  switch (network) {
    case "mainnet":
      if (db.executionClientMainnet.get() !== executionClient)
        await db.executionClientMainnet.set(
          executionClient as ExecutionClientMainnet
        );
      break;
    case "gnosis":
      if (db.executionClientGnosis.get() !== executionClient)
        await db.executionClientGnosis.set(
          executionClient as ExecutionClientGnosis
        );
      break;
    case "prater":
      if (db.executionClientPrater.get() !== executionClient)
        await db.executionClientPrater.set(
          executionClient as ExecutionClientPrater
        );
      break;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}
