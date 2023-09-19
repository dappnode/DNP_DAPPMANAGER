import * as db from "../../db/index.js";
import { listPackageNoThrow } from "../docker/list/index.js";
import { logs } from "@dappnode/logger";
import { EthClientTarget } from "@dappnode/common";
import { packageGet } from "../../calls/index.js";
import { EthClientTargetPackage, UserSettings } from "@dappnode/common";

/**
 * Link between an ethClientTarget keyword and its pacakge information
 * Declared above to use stronger typings
 */
const ethClientData: {
  [P in EthClientTargetPackage]: {
    dnpName: string; // "geth.dnp.dappnode.eth"
    url?: string; // Only provide a URL if it's not "http://geth.dappnode:8545"
    version?: string;
    userSettings?: UserSettings;
  };
} = {
  geth: { dnpName: "geth.dnp.dappnode.eth" },
  nethermind: { dnpName: "nethermind.public.dappnode.eth" },
  besu: { dnpName: "besu.public.dappnode.eth" },
  erigon: { dnpName: "erigon.dnp.dappnode.eth" }
};

/**
 * Switches ethClientTarget in the following preference order: geth > nethermind > remote
 */
export async function switchEthClientIfOpenethereumOrGethLight(): Promise<void> {
  const ethClientTarget = db.ethClientTarget.get() as
    | EthClientTarget
    | null
    | "openethereum" // Add old deprecated type
    | "geth-light"; // Add old deprecated type

  if (ethClientTarget === "openethereum") {
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

      db.ethClientTarget.set("geth");
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
  } else if (ethClientTarget === "geth-light") {
    logs.info(
      "Execution client geth-light deprecated in release v0.2.59. Using remote"
    );
    db.ethClientTarget.set("remote");
  }
}
