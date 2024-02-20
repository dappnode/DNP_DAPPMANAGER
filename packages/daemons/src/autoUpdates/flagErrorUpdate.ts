import { setPending } from "./setPending.js";

/**
 * Flags a pending auto-update as error-ed
 * The purpose of this information is just to provide feedback in the ADMIN UI
 *
 * @param dnpName "bitcoin.dnp.dappnode.eth"
 * @param errorMessage "Mainnet is still syncing"
 */
export function flagErrorUpdate(dnpName: string, errorMessage: string): void {
  setPending(dnpName, { errorMessage });
}
