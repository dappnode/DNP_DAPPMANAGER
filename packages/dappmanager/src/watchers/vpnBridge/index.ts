import { vpnRpcCall } from "../../api/vpnRpcCall";
import * as eventBus from "../../eventBus";
import * as db from "../../db";
import params from "../../params";
import retry from "async-retry";
import { PackageVersionData } from "../../types";
import { logs } from "../../logs";

/**
 * Creates a new device with the provided id.
 * Generates certificates and keys needed for OpenVPN.
 * @param id Device id name
 */
async function getVersionDataVpn(): Promise<void> {
  try {
    const versionDataVpn = await retry(
      () => vpnRpcCall<PackageVersionData>("getVersionData"),
      { retries: 3 }
    );
    db.versionDataVpn.set(versionDataVpn);
  } catch (e) {
    logs.error(`Error fetching VPN data`);
  }
}

export default function runVpnBridge(): void {
  // Initial fetch on start-up
  getVersionDataVpn();

  // Fetch after updating the VPN
  eventBus.packagesModified.on(({ ids }) => {
    if (!ids || !Array.isArray(ids) || ids.includes(params.vpnDnpName)) {
      getVersionDataVpn();
    }
  });
}
