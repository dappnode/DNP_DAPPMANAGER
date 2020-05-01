import { vpnWampCall } from "../../api";
import * as eventBus from "../../eventBus";

/**
 * Resets the device credentials with the provided id, if exists.
 * @param id Device id name
 */
export async function deviceReset({ id }: { id: string }): Promise<void> {
  await vpnWampCall<void>("resetDevice", { id });

  eventBus.requestDevices.emit();
}
