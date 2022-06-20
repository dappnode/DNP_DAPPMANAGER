import * as db from "../../db";
import { listPackageNoThrow } from "../docker/list";
import { logs } from "../../logs";
import { EthClientTarget } from "../../types";
import { packageRemove } from "../../calls";

export async function deprecateOpenEthereum(): Promise<void> {
  const openEthereumPackage = await listPackageNoThrow({
    dnpName: "openethereum.dnp.dappnode.eth"
  });
  if (!openEthereumPackage) return;

  logs.info("Openethereum is deprecated, removing it");
  await packageRemove({
    dnpName: "openethereum.dnp.dappnode.eth",
    deleteVolumes: true
  });

  const ethClientTarget = db.ethClientTarget.get() as
    | EthClientTarget
    | null
    | "openethereum"; // Add old deprecated type

  if (ethClientTarget === "openethereum") {
    logs.info("Openethereum is deprecated, setting ethClientTarget to remote");
    db.ethClientTarget.set("remote");
  }
}
