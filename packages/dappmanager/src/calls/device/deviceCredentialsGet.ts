import { vpnApi } from "../../api/vpnRpcCall";
import { VpnDeviceCredentials } from "../../types";

/**
 * Creates a new OpenVPN credentials file, encrypted.
 * The filename is the (16 chars short) result of hashing the generated salt in the db,
 * concatenated with the device id.
 * @param id Device id name
 */
export async function deviceCredentialsGet({
  id
}: {
  id: string;
}): Promise<VpnDeviceCredentials> {
  const data = await vpnApi.getDeviceCredentials({ id });

  return {
    url: data.url
  };
}
