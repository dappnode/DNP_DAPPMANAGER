import { urlJoin } from "@dappnode/utils";
import { params } from "@dappnode/params";
import { packageSetEnvironment } from "./packageSetEnvironment.js";
import { ComposeFileEditor } from "@dappnode/dockercompose";
import { WireguardDeviceCredentials } from "@dappnode/types";
import { logs } from "@dappnode/logger";

const { WIREGUARD_API_URL, WIREGUARD_DEVICES_ENVNAME, WIREGUARD_DNP_NAME, WIREGUARD_ISCORE, WIREGUARD_MAIN_SERVICE } =
  params;

class WireguardClient {
  getDevices(): string[] {
    // Why not fetch the ENVs from a container inspect > config ??
    // ENVs that are not declared in the compose will show up (i.e. PATH)
    // So it's easier and cleaner to just parse the docker-compose.yml
    const compose = new ComposeFileEditor(WIREGUARD_DNP_NAME, WIREGUARD_ISCORE);
    const service = compose.services()[WIREGUARD_MAIN_SERVICE];
    if (!service) throw Error(`Wireguard service ${WIREGUARD_MAIN_SERVICE} does not exist`);
    const peersCsv = service.getEnvs()[WIREGUARD_DEVICES_ENVNAME] || "";
    return peersCsv
      .split(",")
      .map((device) => device.trim())
      .filter(Boolean);
  }

  async addDevice(device: string): Promise<void> {
    if (!device) throw Error("Device name must not be empty");
    if (!/^[a-z0-9]+$/i.test(device)) throw Error("Device name must contain only alphanumeric characters");

    const devices = new Set(this.getDevices());
    if (devices.has(device)) throw Error(`Device ${device} already exists`);
    devices.add(device);
    await this.setDevices(Array.from(devices.values()));
  }

  async removeDevice(device: string): Promise<void> {
    const devices = new Set(this.getDevices());
    const removed = devices.delete(device);
    if (!removed) throw Error(`Device ${device} does not exist`);
    await this.setDevices(Array.from(devices.values()));
  }

  private async setDevices(devices: string[]): Promise<void> {
    await packageSetEnvironment({
      dnpName: WIREGUARD_DNP_NAME,
      environmentByService: {
        [WIREGUARD_MAIN_SERVICE]: {
          [WIREGUARD_DEVICES_ENVNAME]: devices.join(",")
        }
      }
    });
  }

  // Wireguard API
  // - remote:    '/dappnode_admin'
  // - remote qr: '/dappnode_admin?qr'
  // - local:     '/dappnode_admin?local'
  // - local qr:  '/dappnode_admin?local&qr'
  async getDeviceCredentials(device: string): Promise<WireguardDeviceCredentials> {
    this.ensureDeviceExists(device);

    const configRemote = await this.fetchRemoteDeviceConfig(device);
    const configLocal = await this.fetchLocalDeviceConfig(device);

    return { configRemote, configLocal };
  }

  async getDeviceConfig(device: string, isLocal: boolean): Promise<string> {
    this.ensureDeviceExists(device);
    return isLocal ? this.fetchLocalDeviceConfig(device) : this.fetchRemoteDeviceConfig(device);
  }

  private ensureDeviceExists(device: string): void {
    if (!this.getDevices().includes(device)) throw Error(`Device ${device} is not registered in WireGuard PEERS`);
  }

  private async fetchRemoteDeviceConfig(device: string): Promise<string> {
    return fetchWireguardConfigFile(urlJoin(WIREGUARD_API_URL, device));
  }

  private async fetchLocalDeviceConfig(device: string): Promise<string> {
    const url = `${urlJoin(WIREGUARD_API_URL, device)}?local=true`;

    return fetchWireguardConfigFile(url).catch((e) => {
      logs.warn(`Error fetching local WireGuard credentials for ${device}: ${e.message}`);
      throw e;
    });
  }
}

// Utils

async function fetchWireguardConfigFile(url: string): Promise<string> {
  const res = await fetch(url);

  const body = await res.text();
  if (!res.ok) {
    if (res.status === 404) throw Error(`Device not found: ${body}`);
    throw Error(`Error fetching credentials: ${res.statusText} ${body}`);
  }

  return body;
}

const wireguardClient = new WireguardClient();

// API calls

export async function wireguardDeviceAdd(device: string): Promise<void> {
  await wireguardClient.addDevice(device);
}

export async function wireguardDeviceRemove(device: string): Promise<void> {
  await wireguardClient.removeDevice(device);
}

export async function wireguardDeviceGet(device: string): Promise<WireguardDeviceCredentials> {
  return wireguardClient.getDeviceCredentials(device);
}

export async function wireguardDeviceConfigGet({ device, isLocal }: { device: string; isLocal: boolean }): Promise<string> {
  return wireguardClient.getDeviceConfig(device, isLocal);
}

export async function wireguardDevicesGet(): Promise<string[]> {
  return wireguardClient.getDevices();
}
