import { Routes } from "../../src/common";

const initialDevices = ["dappnode_admin", "other-user", "other-user-2"];
const devicesState = new Set<string>(initialDevices);

export const wireguard: Pick<
  Routes,
  | "wireguardDeviceAdd"
  | "wireguardDeviceGet"
  | "wireguardDeviceRemove"
  | "wireguardDevicesGet"
> = {
  wireguardDeviceAdd: async device => {
    devicesState.add(device);
  },
  wireguardDeviceRemove: async device => {
    devicesState.delete(device);
  },
  wireguardDevicesGet: async () => Array.from(devicesState.values()),
  wireguardDeviceGet: async device => {
    const config = `[Interface]
Address = 172.34.1.2
PrivateKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
ListenPort = 51820
DNS = 172.33.1.2

[Peer]
PublicKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
Endpoint = aaaabbbbaaaabbbb.dyndns.dappnode.io:51820
AllowedIPs = 172.33.0.0/16`;
    return { config };
  }
};
