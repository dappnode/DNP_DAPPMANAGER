import { Routes, VpnDevice } from "@dappnode/common";

const url = "link-to-otp/?id=617824#hdfuisf";
const password = "SAMPLETEMPPASSWORD";
const initialDevices: VpnDevice[] = [
  { id: "admin-name", admin: true, hasChangedPassword: true },
  { id: "other-user", admin: false },
  { id: "second-admin", admin: true, hasChangedPassword: false, password }
];

const devicesState = new Map<string, VpnDevice>(
  initialDevices.map(device => [device.id, device])
);

export const devices: Pick<
  Routes,
  | "deviceAdd"
  | "deviceAdminToggle"
  | "deviceCredentialsGet"
  | "devicePasswordGet"
  | "devicePasswordHas"
  | "deviceRemove"
  | "deviceReset"
  | "devicesList"
> = {
  deviceAdd: async ({ id }) => {
    devicesState.set(id, { id, admin: false });
  },
  deviceAdminToggle: async ({ id, isAdmin }) => {
    const device = devicesState.get(id);
    if (!device) throw Error(`No id ${id}`);
    if (isAdmin) {
      devicesState.set(id, {
        id: device.id,
        admin: true,
        hasChangedPassword: false,
        password
      });
    } else {
      devicesState.set(id, { id: device.id, admin: false });
    }
  },
  deviceCredentialsGet: async ({ id }) => {
    const device = devicesState.get(id);
    if (!device) throw Error(`No id ${id}`);
    return { ...device, url };
  },
  devicePasswordGet: async () => "SAMPLE_LOGIN_TOKEN",
  devicePasswordHas: async () => false,
  deviceRemove: async ({ id }) => {
    devicesState.delete(id);
  },
  deviceReset: async () => {},
  devicesList: async () => Array.from(devicesState.values())
};
