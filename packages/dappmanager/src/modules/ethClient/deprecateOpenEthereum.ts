import * as db from "../../db";
import { listPackageNoThrow } from "../docker/list";
import { logs } from "../../logs";
import { EthClientTarget } from "../../types";
import { packageGet, packageRemove } from "../../calls";
import { ethClientData } from "../../params";

/**
 * Removes deprecated openethereum packages: gnosis and mainet
 * Switches the ethclient target if openethereum was selected
 */
export async function deprecateOpenEthereum(): Promise<void> {
  const openEthereumPackagesNames = [
    "openethereum.dnp.dappnode.eth",
    "openethereum-gnosis-chain.dnp.dappnode.eth"
  ];

  for (const openEthereumPackageName of openEthereumPackagesNames) {
    const openEthereumPackage = await listPackageNoThrow({
      dnpName: openEthereumPackageName
    });
    if (!openEthereumPackage) return;

    logs.info(`${openEthereumPackageName} is deprecated, removing it`);
    await packageRemove({
      dnpName: openEthereumPackageName,
      deleteVolumes: true
    });
  }

  const ethClientTarget = db.ethClientTarget.get() as
    | EthClientTarget
    | null
    | "openethereum"; // Add old deprecated type
  if (ethClientTarget === "openethereum") await switchEthClientTarget();
}

/**
 * Switches ethClientTarget in the following preference order: geth/geth light > nethermind > remote
 */
async function switchEthClientTarget(): Promise<void> {
  // Check for geth
  const gethPackage = await listPackageNoThrow({
    dnpName: ethClientData.geth.dnpName
  });
  if (gethPackage) {
    logs.info("Setting ethClientTarget to geth");
    const gethPackageData = await packageGet({
      dnpName: ethClientData.geth.dnpName
    });

    const gethEnvironment = gethPackageData.userSettings?.environment;
    if (!gethEnvironment)
      throw Error("geth package installed but no environment found");

    const isLightClient =
      gethEnvironment["geth.dnp.dappnode.eth"]["SYNCMODE"] === "light";

    isLightClient
      ? db.ethClientTarget.set("geth-light")
      : db.ethClientTarget.set("geth");
    return;
  }

  // Check for nethermind
  const nethermindPackage = await listPackageNoThrow({
    dnpName: ethClientData.nethermind.dnpName
  });
  if (nethermindPackage) {
    logs.info("Setting ethClientTarget to nethermind");
    db.ethClientTarget.set("nethermind");
    return;
  }

  logs.info("Setting ethClientTarget to remote");
  db.ethClientTarget.set("remote");
}
