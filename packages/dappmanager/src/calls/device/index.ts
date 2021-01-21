import {
  AdminPasswordDb,
  AdminPasswordDbError
} from "../../api/auth/adminPasswordDb";
import { VpnApiClient } from "../../api/vpnApiClient";
import {
  VpnDeviceCredentials,
  VpnDevice,
  VpnDeviceAdminPassword
} from "../../types";

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
  deviceAdminToggle = async ({
    id,
    isAdmin
  }: {
    id: string;
    isAdmin: boolean;
  }): Promise<void> => {
    // Set admin status in local DB
    this.adminPasswordDb.setIsAdmin(id, isAdmin);

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
    const device = await this.devicelist(id);

    return { url: data.url, ...device };
  };

  /**
   * Returns true if a password has been created for this device
   * @param id Device id name
   */
  devicePasswordHas = async ({ id }: { id: string }): Promise<boolean> => {
    return this.adminPasswordDb.hasAdminId(id);
  };

  /**
   * Returns the login token of this device, creating it if necessary
   * If the password has been changed and is no longer a login token, throws
   * @param id Device id name
   */
  devicePasswordGet = async ({ id }: { id: string }): Promise<string> => {
    const device = await this.devicelist(id);
    if (!device.admin) throw Error(`Device ${id} is not admin`);

    return this.adminPasswordDb.generateLoginToken(id);
  };

  /**
   * Removes the device with the provided id, if exists.
   * @param id Device id name
   */
  deviceRemove = async ({ id }: { id: string }): Promise<void> => {
    await this.vpnApiClient.removeDevice({ id });
    this.eventBus.requestDevices.emit();

    this.adminPasswordDb.removeId(id);

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
    const vpnDevices = await this.vpnApiClient.listDevices();
    return vpnDevices.map((device): VpnDevice => this.readDevice(device.id));
  };

  private devicelist = async (id: string): Promise<VpnDevice> => {
    const vpnDevices = await this.vpnApiClient.listDevices();
    const device = vpnDevices.find(d => d.id === id);
    if (!device) throw Error(`Device ${id} not found`);
    return this.readDevice(device.id);
  };

  private readDevice(id: string): VpnDevice {
    const admin = this.adminPasswordDb.isAdmin(id);
    if (admin) {
      return { id, admin, ...this.getAdminPassword(id) };
    } else {
      return { id, admin };
    }
  }

  private getAdminPassword(id: string): VpnDeviceAdminPassword {
    try {
      const password = this.adminPasswordDb.generateLoginToken(id);
      return { hasChangedPassword: false as const, password };
    } catch (e) {
      if (e.message === AdminPasswordDbError.PASSWORD_CHANGED) {
        return { hasChangedPassword: true as const };
      } else {
        throw e;
      }
    }
  }
}
