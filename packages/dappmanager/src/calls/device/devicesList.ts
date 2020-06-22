import { vpnRpcCall } from "../../api/vpnRpcCall";
import { VpnDevice } from "../../types";

/**
 * Returns a list of the existing devices, with the admin property
 */
export async function devicesList(): Promise<VpnDevice[]> {
  return await vpnRpcCall<VpnDevice[]>("listDevices");
}
