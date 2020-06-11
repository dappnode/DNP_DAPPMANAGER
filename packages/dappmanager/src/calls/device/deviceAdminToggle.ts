import { vpnRpcCall } from "../../httpApi/vpnRpcCall";
import * as eventBus from "../../eventBus";

/**
 * Gives/removes admin rights to the provided device id.
 * @param id Device id name
 */
export async function deviceAdminToggle({ id }: { id: string }): Promise<void> {
  await vpnRpcCall<void>("toggleAdmin", { id });
  eventBus.requestDevices.emit();
}
