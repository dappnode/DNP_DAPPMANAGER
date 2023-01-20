import { Routes } from "@dappnode/common";

const initialDevices = [
  "dappnode_admin",
  "other-user",
  "wireguard-other-user-2"
];
const devicesState = new Set<string>(initialDevices);

export const wireguard: Pick<
  Routes,
  | "wireguardDeviceAdd"
  | "wireguardDeviceGet"
  | "wireguardDeviceRemove"
  | "wireguardDevicesGet"
> = {
  wireguardDeviceAdd: async id => {
    devicesState.add(id);
  },
  wireguardDeviceRemove: async id => {
    devicesState.delete(id);
  },
  wireguardDevicesGet: async () => Array.from(devicesState.values()),
  wireguardDeviceGet: async id => {
    if (!devicesState.has(id)) throw Error(`No device id ${id}`);
    const configRemote = `[Interface]
Address = 172.34.1.2
PrivateKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
ListenPort = 51820
DNS = 172.33.1.2

[Peer]
PublicKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
Endpoint = aaaabbbbaaaabbbb.dyndns.dappnode.io:51820
AllowedIPs = 172.33.0.0/16`;
    const configLocal = `[Interface]
Address = 172.34.1.2
PrivateKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
ListenPort = 51820
DNS = 172.33.1.2

[Peer]
PublicKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
Endpoint = 192.168.1.45:51820
AllowedIPs = 172.33.0.0/16`;

    return { configRemote, configLocal };
  }
};
