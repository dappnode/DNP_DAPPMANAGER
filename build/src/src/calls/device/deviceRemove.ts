import { vpnWampCall } from "../../api";
import * as eventBus from "../../eventBus";

/**
 * Removes the device with the provided id, if exists.
 * @param id Device id name
 */
export async function deviceRemove({ id }: { id: string }): Promise<void> {
  await vpnWampCall<void>("removeDevice", { id });

  eventBus.requestDevices.emit();
}
