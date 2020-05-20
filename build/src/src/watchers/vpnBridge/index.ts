import { vpnWampCall } from "../../api";
import * as eventBus from "../../eventBus";
import * as db from "../../db";
import params from "../../params";
import { runWithRetry } from "../../utils/asyncFlows";
import { PackageVersionData } from "../../types";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * Creates a new device with the provided id.
 * Generates certificates and keys needed for OpenVPN.
 * @param id Device id name
 */
async function getVersionDataVpn(): Promise<void> {
  try {
    const versionDataVpn = await runWithRetry(
      () => vpnWampCall<PackageVersionData>("getVersionData"),
      { times: 3, base: 1000 }
    )(null);
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
