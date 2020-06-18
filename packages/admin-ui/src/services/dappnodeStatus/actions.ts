import { api } from "api";
import { dappnodeStatus } from "./reducer";
import { AppThunk } from "store";
import {
  wifiName,
  wifiEnvWPA_PASSPHRASE,
  wifiEnvSSID,
  wifiDefaultWPA_PASSPHRASE
} from "params";

// Service > dappnodeStatus

// Update

export const setSystemInfo = dappnodeStatus.actions.systemInfo;
export const updateAutoUpdateData = dappnodeStatus.actions.autoUpdateData;
export const updateVolumes = dappnodeStatus.actions.volumes;
const updateWifiStatus = dappnodeStatus.actions.wifiStatus;
const updatePasswordIsSecure = dappnodeStatus.actions.passwordIsSecure;

// Fetch

export const fetchAutoUpdateData = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(updateAutoUpdateData(await api.autoUpdateDataGet()));
  }, "autoUpdateData");

export const fetchPasswordIsSecure = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(updatePasswordIsSecure(await api.passwordIsSecure()));
  }, "passwordIsSecure");

export const fetchVolumes = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(updateVolumes(await api.volumesGet()));
  }, "volumesGet");

export const fetchSystemInfo = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(setSystemInfo(await api.systemInfoGet()));
  }, "systemInfoGet");

/**
 * Check if the wifi DNP has the same credentials as the default ones
 * @returns credentials are the same as the default ones
 */
export const fetchWifiStatus = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    const wifiDnp = await api.packageGet({ id: wifiName });
    const environment = wifiDnp.userSettings?.environment || {};
    const ssid = environment[wifiEnvSSID];
    const pass = environment[wifiEnvWPA_PASSPHRASE];
    const isDefault = pass === wifiDefaultWPA_PASSPHRASE;

    const logs = await api.packageLog({ id: wifiName });
    const firstLogLine = logs.trim().split("\n")[0];
    const running = !firstLogLine.includes("No interface found");
    dispatch(updateWifiStatus({ running, ssid, isDefault }));
  }, "wifiStatus");

/**
 * Util to guard against throws in thunk actions
 */
async function withTryCatch(fn: () => Promise<void>, id = "") {
  try {
    await fn();
  } catch (e) {
    console.error(`Error fetching ${id}`, e);
  }
}
