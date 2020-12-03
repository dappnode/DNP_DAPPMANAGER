import { vpnApi } from "../../api/vpnRpcCall";
import * as eventBus from "../../eventBus";

/**
 * Creates a new device with the provided id.
 * Generates certificates and keys needed for OpenVPN.
 * @param id Device id name
 */
export async function deviceAdd({ id }: { id: string }): Promise<void> {
  await vpnApi.addDevice({ id });

  eventBus.requestDevices.emit();
}
