import { api } from "api";
import { dappnodeStatus } from "./reducer";
import { AppThunk } from "store";
import {
  wifiDnpName,
  wifiEnvWPA_PASSPHRASE,
  wifiEnvSSID,
  wifiDefaultWPA_PASSPHRASE
} from "params";

// Service > dappnodeStatus

// Update

export const setIsConnectedToInternet =
  dappnodeStatus.actions.isConnectedToInternet;
export const setSystemInfo = dappnodeStatus.actions.systemInfo;
export const updateVolumes = dappnodeStatus.actions.volumes;
export const setRebootHostIsRequired =
  dappnodeStatus.actions.rebootRequiredScript;
const updateWifiCredentials = dappnodeStatus.actions.wifiCredentials;
const updatePasswordIsSecure = dappnodeStatus.actions.passwordIsSecure;
const updateShouldShowSmooth = dappnodeStatus.actions.shouldShowSmooth;

// Fetch

export const fetchShouldShowSmooth = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(updateShouldShowSmooth(await api.getShouldShowSmooth()));
  }, "getShouldShowSmooth");
export const fetchIsConnectedToInternet = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(setIsConnectedToInternet(await api.getIsConnectedToInternet()));
  }, "getIsConnectedToInternet");

export const fetchRebootIsRequired = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(setRebootHostIsRequired(await api.rebootHostIsRequiredGet()));
  }, "rebootHostIsRequiredGet");

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
export const fetchWifiCredentials = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    const wifiDnp = await api.packageGet({ dnpName: wifiDnpName });
    const environment =
      (wifiDnp.userSettings?.environment || {})[wifiDnpName] || {};
    const ssid: string = environment[wifiEnvSSID];
    const pass: string = environment[wifiEnvWPA_PASSPHRASE];
    const isDefaultPassphrase = pass === wifiDefaultWPA_PASSPHRASE;

    dispatch(updateWifiCredentials({ ssid, isDefaultPassphrase }));
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
