import { vpnRpcCall } from "../../api/vpnRpcCall";
import * as eventBus from "../../eventBus";

/**
 * Removes the device with the provided id, if exists.
 * @param id Device id name
 */
export async function deviceRemove({ id }: { id: string }): Promise<void> {
  await vpnRpcCall<void>("removeDevice", { id });

  eventBus.requestDevices.emit();
}
