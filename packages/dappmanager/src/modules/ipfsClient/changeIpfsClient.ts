import params from "../../params";
import * as db from "../../db";
import { packageRemove, packageGet, packageInstall } from "../../calls";
import { IpfsClientTarget } from "../../types";
import { ipfs } from "../ipfs";

/**
 * Changes IPFS client from remote to local and viceversa.
 * I local mode is set and IPFS is not installed, it will install
 * the IPFS package
 * @param nextTarget "local" | "remote"
 * @param deleteLocalIpfsClient If set delete IPFS package
 * @param nextGateway Gateway endpoint to be used by remote node. By default dappnode gateway
 */
export async function changeIpfsClient(
  nextTarget: IpfsClientTarget,
  deleteLocalIpfsClient?: boolean,
  nextGateway?: string
): Promise<void> {
  try {
    // Return if targets and gateways are equal
    const currentTarget = db.ipfsClientTarget.get();
    const currentGateway = db.ipfsGateway.get();
    if (currentTarget === nextTarget && currentGateway === nextGateway) return;

    const isInstalled = await isIpfsInstalled();

    if (nextTarget === "local") {
      if (!isInstalled) await packageInstall({ name: params.ipfsDnpName });
      db.ipfsClientTarget.set("local");
      ipfs.changeHost(params.IPFS_LOCAL, "local");
    } else {
      // Delete IPFS on demmand
      if (isInstalled && deleteLocalIpfsClient)
        await packageRemove({ dnpName: params.ipfsDnpName });

      // Set new values in db
      db.ipfsGateway.set(nextGateway || params.IPFS_GATEWAY);
      db.ipfsClientTarget.set("remote");

      // Change IPFS host
      ipfs.changeHost(db.ipfsGateway.get(), "remote");
    }
  } catch (e) {
    throw Error(`Error changing ipfs client to ${nextTarget}, ${e}`);
  }
}

async function isIpfsInstalled(): Promise<boolean> {
  try {
    await packageGet({ dnpName: params.ipfsDnpName });
    return true;
  } catch (e) {
    if (e.message.includes("No DNP was found")) return false;
    throw Error(`Error detecting if ${params.ipfsDnpName} is installed`);
  }
}
