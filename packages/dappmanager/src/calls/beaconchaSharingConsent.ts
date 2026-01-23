import * as db from "@dappnode/db";
import { BeaconchaSharingConsent, DashboardSupportedNetwork } from "@dappnode/types";

/**
 * Returns the consent to share validators data for all supported networks
 */
export async function beaconchaSharingConsentGet(): Promise<BeaconchaSharingConsent> {
  return db.beaconchaSharingConsent.get();
}

/**
 * Sets the consent to share validators data for a given network
 * @param network The network for which to set the consent
 * @param consent The consent value
 */
export async function beaconchaSharingConsentSet({
  network,
  consent
}: {
  network: DashboardSupportedNetwork;
  consent: boolean;
}): Promise<void> {
  db.beaconchaSharingConsent.set({ ...db.beaconchaSharingConsent.get(), [network]: consent });
}
