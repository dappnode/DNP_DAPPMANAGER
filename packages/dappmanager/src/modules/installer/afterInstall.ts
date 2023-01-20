import { eventBus } from "../../eventBus.js";
import { flagPackagesAreNotInstalling } from "./packageIsInstalling.js";

/**
 * Bundle event emits that must be called on a successful and failed install
 * @param dnpNames ["pkg.dnp.dappnode.eth"]
 */
export async function afterInstall(dnpNames: string[]): Promise<void> {
  /**
   * [NAT-RENEWAL] Trigger a natRenewal update to open ports if necessary
   * Since a package installation is not a very frequent activity it is okay to be
   * called on each install. Internal mechanisms protect the natRenewal function
   * to be called too often.
   */
  eventBus.runNatRenewal.emit();

  // Emit packages update
  eventBus.requestPackages.emit();
  eventBus.packagesModified.emit({ dnpNames: dnpNames });

  // Flag the packages as NOT installing.
  // Must be called also on Error, otherwise packages can't be re-installed
  flagPackagesAreNotInstalling(dnpNames);
}
