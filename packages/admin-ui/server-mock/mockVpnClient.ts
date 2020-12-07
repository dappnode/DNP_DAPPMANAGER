import { VpnApiClient } from "../../dappmanager/src/api/vpnApiClient";
import { PackageVersionData, VpnDevice } from "../src/types";

const ip = "1.1.1.1";
const url = "link-to-otp/?id=617824#hdfuisf";
const initialDevices: VpnDevice[] = [
  { id: "admin-name", admin: true, ip },
  { id: "other-user", admin: false, ip }
];

export class MockVpnApiClient implements VpnApiClient {
  devices: Map<string, VpnDevice>;

  constructor() {
    this.devices = new Map<string, VpnDevice>(
      initialDevices.map(device => [device.id, device])
    );
  }

  async addDevice({ id }: { id: string }): Promise<void> {
    this.devices.set(id, { id, admin: false, ip });
  }

  async toggleAdmin(kwargs: { id: string; isAdmin: boolean }): Promise<void> {
    const { id, isAdmin } = kwargs;
    const device = this.devices.get(id);
    if (!device) throw Error(`No id ${id}`);
    this.devices.set(id, { ...device, admin: isAdmin });
  }

  async removeDevice({ id }: { id: string }): Promise<void> {
    this.devices.delete(id);
  }

  async resetDevice({ id }: { id: string }): Promise<void> {
    //
  }

  async listDevices(): Promise<{ id: string; admin: boolean; ip: string }[]> {
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
