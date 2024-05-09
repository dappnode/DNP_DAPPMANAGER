import * as db from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";

/**
 * Determines whether the Smooth modal should be shown.
 * @returns A Promise that resolves to true if the Smooth modal should be shown; otherwise, false.
 */
export async function getShouldShowSmooth(): Promise<boolean> {
  // If the Smooth modal has already been shown, return false
  if (db.smoothShown.get() === true) return false;

  // If the Smooth modal has not been shown yet, check if it should be shown
  // The Smooth modal should be shown if the web3signer mainnet is installed
  if (await listPackageNoThrow({ dnpName: "web3signer.dnp.dappnode.eth" }))
    return true;
  else return false;
}

/**
 * Sets the status indicating whether the Smooth modal has been shown.
 * @param isShown A boolean indicating whether the Smooth modal has been shown.
 * @returns A Promise that resolves when the status is successfully updated.
 */
export async function setShouldShownSmooth({
  isShown
}: {
  isShown: boolean;
}): Promise<void> {
  // Update the status indicating whether the Smooth modal has been shown
  db.smoothShown.set(isShown);
}