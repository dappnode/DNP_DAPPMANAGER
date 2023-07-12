import { VpnDevice, PackageVersionData } from "@dappnode/common";
import { VpnApiClient } from "@dappnode/dappmanager/src/api/vpnApiClient";

const url = "link-to-otp/?id=617824#hdfuisf";
const password = "SAMPLETEMPPASSWORD";
const initialDevices: VpnDevice[] = [
  { id: "admin-name", admin: true, hasChangedPassword: true },
  { id: "other-user", admin: false },
  { id: "second-device", admin: true, hasChangedPassword: false, password }
];

export class MockVpnApiClient implements VpnApiClient {
  devices: Map<string, VpnDevice>;

  constructor() {
    this.devices = new Map<string, VpnDevice>(
      initialDevices.map(device => [device.id, device])
    );
  }

  async addDevice({ id }: { id: string }): Promise<void> {
    this.devices.set(id, { id, admin: false });
  }

  async toggleAdmin(kwargs: { id: string; isAdmin: boolean }): Promise<void> {
    const { id, isAdmin } = kwargs;
    const device = this.devices.get(id);
    if (!device) throw Error(`No id ${id}`);
    if (isAdmin) {
      this.devices.set(id, {
        id: device.id,
        admin: true,
        hasChangedPassword: false,
        password
      });
    } else {
      this.devices.set(id, { id: device.id, admin: false });
    }
  }

  async removeDevice({ id }: { id: string }): Promise<void> {
    this.devices.delete(id);
  }

  async resetDevice({ id }: { id: string }): Promise<void> {
    //
  }

  async listDevices(): Promise<{ id: string; admin: boolean }[]> {
    return Array.from(this.devices.values());
  }

  async getDeviceCredentials(kwargs: {
    id: string;
  }): Promise<{ filename: string; key: string; url: string }> {
    return { filename: "00000", key: "0000000", url };
  }

  async getVersionData(): Promise<PackageVersionData> {
    return {};
  }
}
