import { vpnWampCall } from "../../api";

/**
 * Gives/removes admin rights to the provided device id.
 * @param id Device id name
 */
export async function deviceAdminToggle({ id }: { id: string }): Promise<void> {
  return await vpnWampCall<void>("toggleAdmin", { id });
}
