import { AdminPasswordDb } from "../../api/auth/adminPasswordDb";
import { VpnApiClient } from "../../api/vpnApiClient";
import { VpnDeviceCredentials, VpnDevice } from "../../types";

// Temporal solution until eventBus is properly typed
interface EventBusDevices {
  requestDevices: {
    emit(): void;
  };
}

interface DeviceCallsModules {
  eventBus: EventBusDevices;
  adminPasswordDb: AdminPasswordDb;
  vpnApiClient: VpnApiClient;
}

export class DeviceCalls {
  eventBus: EventBusDevices;
  adminPasswordDb: AdminPasswordDb;
  vpnApiClient: VpnApiClient;

  constructor({ eventBus, adminPasswordDb, vpnApiClient }: DeviceCallsModules) {
    this.eventBus = eventBus;
    this.adminPasswordDb = adminPasswordDb;
    this.vpnApiClient = vpnApiClient;
  }

  /**
   * Creates a new device with the provided id.
   * Generates certificates and keys needed for OpenVPN.
   * @param id Device id name
   */
  deviceAdd = async ({ id }: { id: string }): Promise<void> => {
    await this.vpnApiClient.addDevice({ id });
    this.eventBus.requestDevices.emit();
  };

  /**
   * Gives/removes admin rights to the provided device id.
   * @param id Device id name
   */
  deviceAdminToggle = async ({ id }: { id: string }): Promise<void> => {
    await this.vpnApiClient.toggleAdmin({ id });
    this.eventBus.requestDevices.emit();
  };

  /**
   * Creates a new OpenVPN credentials file, encrypted.
   * The filename is the (16 chars short) result of hashing the generated salt in the db,
   * concatenated with the device id.
   * @param id Device id name
   */
  deviceCredentialsGet = async ({
    id
  }: {
    id: string;
  }): Promise<VpnDeviceCredentials> => {
    const data = await this.vpnApiClient.getDeviceCredentials({ id });

    const devices = await this.vpnApiClient.listDevices();
    const device = devices.find(d => d.id === id);

    if (!device) throw Error(`Device ${id} not found`);

    return {
      ...device,
      url: data.url,
      // Only get it if it's admin
      password: device?.admin
        ? this.adminPasswordDb.generatePasswordById(id)
        : undefined
    };
  };

  /**
   * Removes the device with the provided id, if exists.
   * @param id Device id name
   */
  deviceRemove = async ({ id }: { id: string }): Promise<void> => {
    await this.vpnApiClient.removeDevice({ id });
    this.eventBus.requestDevices.emit();

    this.adminPasswordDb.removePasswordById(id);

    // TODO: Add a timeout in the Socket.io to close socket connections
    // every once in a while to prevent long running logins
  };

  /**
   * Resets the device credentials with the provided id, if exists.
   * @param id Device id name
   */
  deviceReset = async ({ id }: { id: string }): Promise<void> => {
    await this.vpnApiClient.resetDevice({ id });
    this.eventBus.requestDevices.emit();
  };

  /**
   * Returns a list of the existing devices, with the admin property
   */
  devicesList = async (): Promise<VpnDevice[]> => {
    return await this.vpnApiClient.listDevices();
  };
}
