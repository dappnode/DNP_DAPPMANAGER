import { vpnWampCall } from "../../api";
import * as eventBus from "../../eventBus";

/**
 * Gives/removes admin rights to the provided device id.
 * @param id Device id name
 */
export async function deviceAdminToggle({ id }: { id: string }): Promise<void> {
  await vpnWampCall<void>("toggleAdmin", { id });
  eventBus.requestDevices.emit();
}
