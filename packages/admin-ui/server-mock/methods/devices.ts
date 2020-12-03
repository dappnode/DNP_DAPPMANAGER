import { VpnDeviceCredentials, VpnDevice } from "../../src/common";

const ip = "1.1.1.1";
const url = "link-to-otp/?id=617824#hdfuisf";
const initialDevices: VpnDevice[] = [
  { id: "admin-name", admin: true, ip },
  { id: "other-user", admin: false, ip }
];

const devices = new Map<string, VpnDevice>(
  initialDevices.map(device => [device.id, device])
);

/**
 * Creates a new device with the provided id.
 * Generates certificates and keys needed for OpenVPN.
 */
export async function deviceAdd({ id }: { id: string }): Promise<void> {
  devices.set(id, { id, admin: false, ip });
}

/**
 * Creates a new OpenVPN credentials file, encrypted.
 * The filename is the (16 chars short) result of hashing the generated salt in the db,
 * concatenated with the device id.
 */
export async function deviceCredentialsGet({
  id
}: {
  id: string;
}): Promise<VpnDeviceCredentials> {
  const device = devices.get(id);
  if (!device) throw Error(`No device ${id}`);
  return {
    ...device,
    url,
    password: "Wka2Sb1NbiVBV2QX"
  };
}

/**
 * Removes the device with the provided id, if exists.
 */
export async function deviceRemove({ id }: { id: string }): Promise<void> {
  devices.delete(id);
}

/**
 * Resets the device credentials with the provided id, if exists.
 */
export async function deviceReset({ id }: { id: string }): Promise<void> {
  //
}

/**
 * Gives/removes admin rights to the provided device id.
 */
export async function deviceAdminToggle({ id }: { id: string }): Promise<void> {
  const device = devices.get(id);
  if (!device) throw Error(`No id ${id}`);
  devices.set(id, { ...device, admin: !device.admin });
}

/**
 * Returns a list of the existing devices, with the admin property
 */
export async function devicesList(): Promise<VpnDevice[]> {
  return Array.from(devices.values());
}
