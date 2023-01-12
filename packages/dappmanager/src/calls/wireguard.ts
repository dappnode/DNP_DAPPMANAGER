import { WireguardDeviceCredentials } from "@dappnode/common";
import { WireguardClient } from "../modules/wireguard/client";

const wireguardClient = new WireguardClient();

export async function wireguardDeviceAdd(device: string): Promise<void> {
  await wireguardClient.addDevice(device);
}

export async function wireguardDeviceRemove(device: string): Promise<void> {
  await wireguardClient.removeDevice(device);
}

export async function wireguardDeviceGet(
  device: string
): Promise<WireguardDeviceCredentials> {
  return wireguardClient.getDeviceCredentials(device);
}

export async function wireguardDevicesGet(): Promise<string[]> {
  return wireguardClient.getDevices();
}
