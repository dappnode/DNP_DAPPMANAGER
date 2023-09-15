import {
  ExecutionClient,
  StakerItemOk,
  InstalledPackageData
} from "@dappnode/common";
import { packageInstall } from "../../../calls/index.js";
import { logs } from "../../../logs.js";
import { dockerComposeUpPackage } from "../../docker/index.js";
import { listPackageNoThrow } from "../../docker/list/index.js";
import { stopAllPkgContainers } from "./stopAllPkgContainers.js";
import { Network } from "@dappnode/types";
import { ethereumClient } from "../../ethClient/index.js";

export async function setExecutionClient<T extends Network>({
  currentExecutionClient,
  targetExecutionClient,
  currentExecClientPkg,
  network
}: {
  currentExecutionClient?: ExecutionClient<T> | null;
  targetExecutionClient?: StakerItemOk<T, "execution">;
  currentExecClientPkg?: InstalledPackageData;
  network: T;
}): Promise<void> {

  if (!targetExecutionClient?.dnpName && !currentExecutionClient) {
    // Stop the current execution client if no option and not current execution client
    logs.info(`No execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (!targetExecutionClient?.dnpName && currentExecutionClient) {
    // Stop the current execution client if no target provided
    logs.info(`No execution client selected`);
    if (currentExecClientPkg) await stopAllPkgContainers(currentExecClientPkg);
  } else if (targetExecutionClient?.dnpName && !currentExecutionClient) {
    const targetExecClientPkg = await listPackageNoThrow({
      dnpName: targetExecutionClient.dnpName
    });
    if (!targetExecClientPkg) {
      // Install new execution client if not installed
      await packageInstall({ name: targetExecutionClient.dnpName });
    } else {
      // Start new execution client if not running
      await dockerComposeUpPackage(
        { dnpName: targetExecClientPkg.dnpName },
        {},
        {},
        true
      ).catch(err => logs.error(err));
    }

    // TODO: await? Does not look necessary
    updateFullnodeDomain({ targetExecutionClient, network }).catch(
      err => logs.error(`Fullnode domain could not be updated: ${err}`)
    );

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

    // TODO: await? Does not look necessary
    updateFullnodeDomain({ targetExecutionClient, network }).catch(
      err => logs.error(`Fullnode domain could not be updated: ${err}`)
    );

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

      // TODO: await? Does not look necessary
      updateFullnodeDomain({ targetExecutionClient, network }).catch(
        err => logs.error(`Fullnode domain could not be updated: ${err}`)
      );

      // Stop old client
      if (currentExecClientPkg)
        await stopAllPkgContainers(currentExecClientPkg);
    }
  }
}

async function updateFullnodeDomain<T extends Network>({
  targetExecutionClient,
  network
}: {
  targetExecutionClient: StakerItemOk<T, "execution">,
  network: T
}): Promise<void> {
  if (network === "mainnet") {
    await
      ethereumClient.setDefaultEthClientFullNode({
        dnpName: targetExecutionClient.dnpName as ExecutionClient<"mainnet">,
        removeAlias: false
      })
  } else {
    logs.info("Fullnode domain is only updated for mainnet")
  }
}
