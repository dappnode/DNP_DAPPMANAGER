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
import { Network } from "@dappnode/types";

export async function setExecutionClient<T extends Network>({
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
