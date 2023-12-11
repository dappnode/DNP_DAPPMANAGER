import {
  ExecutionClient,
  StakerItemOk,
  Network,
  InstalledPackageData,
} from "@dappnode/common";
import { DappnodeInstaller, packageInstall } from "@dappnode/installer";
import { logs } from "@dappnode/logger";
import {
  dockerComposeUpPackage,
  listPackageNoThrow,
} from "@dappnode/dockerapi";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";

export async function setExecutionClient<T extends Network>({
  dappnodeInstaller,
  currentExecutionClient,
  targetExecutionClient,
  currentExecClientPkg,
}: {
  dappnodeInstaller: DappnodeInstaller;
  currentExecutionClient?: ExecutionClient<T> | null;
  targetExecutionClient?: StakerItemOk<T, "execution">;
  currentExecClientPkg?: InstalledPackageData;
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
      dnpName: targetExecutionClient.dnpName,
    });
    if (!targetExecClientPkg) {
      // Install new consensus client if not installed
      await packageInstall(dappnodeInstaller, {
        name: targetExecutionClient.dnpName,
      });
    } else {
      // Start new consensus client if not running
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch((err) => logs.error(err));
    }
  } else if (
    targetExecutionClient?.dnpName &&
    targetExecutionClient.dnpName === currentExecutionClient
  ) {
    if (!currentExecClientPkg) {
      logs.info("Installing execution client " + targetExecutionClient);
      await packageInstall(dappnodeInstaller, {
        name: targetExecutionClient.dnpName,
      });
    } else {
      await dockerComposeUpPackage(
        { dnpName: currentExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch((err) => logs.error(err));
    }
  } else if (
    targetExecutionClient &&
    targetExecutionClient.dnpName !== currentExecutionClient
  ) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient.dnpName,
    });
    if (!targetExecClientPkg) {
      // Install new client if not installed
      await packageInstall(dappnodeInstaller, {
        name: targetExecutionClient.dnpName,
      });
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
      ).catch((err) => logs.error(err));
      // Stop old client
      if (currentExecClientPkg)
        await stopAllPkgContainers(currentExecClientPkg);
    }
  }
}
