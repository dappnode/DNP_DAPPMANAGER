import { getVpnApiClient } from "../../api/vpnApiClient";
import * as eventBus from "../../eventBus";
import * as db from "../../db";
import params from "../../params";
import retry from "async-retry";
import { logs } from "../../logs";

const vpnApiClient = getVpnApiClient(params);

/**
 * Creates a new device with the provided id.
 * Generates certificates and keys needed for OpenVPN.
 * @param id Device id name
 */
async function getVersionDataVpn(): Promise<void> {
  try {
    const versionDataVpn = await retry(() => vpnApiClient.getVersionData(), {
      retries: 3
    });
    db.versionDataVpn.set(versionDataVpn);
  } catch (e) {
    logs.error(`Error fetching VPN data`);
  }
}

export default function runVpnBridge(): void {
  // Initial fetch on start-up
  getVersionDataVpn();

  // Fetch after updating the VPN
  eventBus.packagesModified.on(({ dnpNames }) => {
    if (
      !dnpNames ||
      !Array.isArray(dnpNames) ||
      dnpNames.includes(params.vpnDnpName)
    ) {
      getVersionDataVpn();
    }
  });
}
