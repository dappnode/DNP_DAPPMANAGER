import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { IpfsTarget } from "../../common";
import params from "../../params";
import { packageRemove } from "../../calls";
import { logs } from "../../logs";

/**
 *  Changes Ipfs target: LOCAL - REMOTE
 *  Set new Url deppending on the target
 *  Triggers IPFS package installation if necessary
 */
export async function changeIpfsTarget(
  nextTarget: IpfsTarget,
  deleteIpfs?: boolean
): Promise<void> {
  // Get previous target
  const prevTarget = db.ipfsTarget.get();

  // Delete IPFS on demmand by the user
  if (prevTarget !== nextTarget && prevTarget && prevTarget !== "remote") {
    if (deleteIpfs) {
      try {
        await packageRemove({ dnpName: params.ipfsDnpName });
      } catch (e) {
        logs.error("Error removing IPFS package", e);
      }
    }
  }

  // Set new ipfs target
  db.ipfsTarget.set(nextTarget);

  // Set new URL
  db.ipfsProviderUrl.set(
    nextTarget === "local" ? params.IPFS_HOST : params.IPFS_HOST_GATEWAY
  );

  // Setting the status to selected will trigger DAppNodePackage-ipfs installation
  if (prevTarget !== nextTarget && nextTarget !== "remote") {
    db.ipfsInstallStatus.set(nextTarget, { status: "TO_INSTALL" });
    eventBus.runIpfsInstaller.emit();
  }
}
