import params from "../../params";
import * as db from "../../db";
import { packageRemove, packageGet, packageInstall } from "../../calls";
import { IpfsClientTarget } from "../../types";
import { ipfs } from "../ipfs";

/**
 * Changes IPFS client from remote to local and viceversa.
 * I local mode is set and IPFS is not installed, it will install
 * the IPFS package
 * @param deleteLocalIpfsClient If set delete IPFS package
 */
export async function changeIpfsClient(
  nextTarget: IpfsClientTarget,
  deleteLocalIpfsClient?: boolean
): Promise<void> {
  try {
    // Return if targets are equal
    const currentTarget = db.ipfsClientTarget.get();
    if (currentTarget === nextTarget) return;

    const isInstalled = await isIpfsInstalled();

    if (nextTarget === "local") {
      if (!isInstalled) await packageInstall({ name: params.ipfsDnpName });
      db.ipfsClientTarget.set("local");
      ipfs.changeHost(params.IPFS_LOCAL, "local");
    } else {
      if (isInstalled && deleteLocalIpfsClient)
        await packageRemove({ dnpName: params.ipfsDnpName });
      db.ipfsClientTarget.set("remote");
      ipfs.changeHost(params.IPFS_REMOTE, "remote");
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
