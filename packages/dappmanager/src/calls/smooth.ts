import * as db from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";

export async function getShouldShowSmooth(): Promise<boolean> {
  console.log("getShouldShowSmooth has been called")
  if (db.smoothShown.get() === true) return false;

  // If the the smooth has not been shown yet, check if it should be shown or not
  // when it should be shown? if web3signer mainnet is installed
  if (await listPackageNoThrow({ dnpName: "web3signer.dnp.dappnode.eth" }))
    return true;
  else return false;
}

export async function setShouldShownSmooth({
  isShown
}: {
  isShown: boolean;
}): Promise<void> {
  db.smoothShown.set(isShown);
}
