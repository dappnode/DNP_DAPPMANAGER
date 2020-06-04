import { api } from "api";
import { dappnodeStatus } from "./reducer";
import { AppThunk } from "store";
import { wifiName } from "params";

// Service > dappnodeStatus

// Update

export const setSystemInfo = dappnodeStatus.actions.systemInfo;
export const updateAutoUpdateData = dappnodeStatus.actions.autoUpdateData;
export const updateVolumes = dappnodeStatus.actions.volumes;
const updateWifiStatus = dappnodeStatus.actions.wifiStatus;
const updatePasswordIsInsecure = dappnodeStatus.actions.passwordIsInsecure;

// Fetch

export const fetchAutoUpdateData = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(updateAutoUpdateData(await api.autoUpdateDataGet()));
  }, "autoUpdateData");

export const fetchPasswordIsInsecure = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(updatePasswordIsInsecure(await api.passwordIsSecure()));
  }, "passwordIsSecure");

export const fetchVolumes = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(updateVolumes(await api.volumesGet()));
  }, "volumesGet");

export const fetchSystemInfo = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    dispatch(setSystemInfo(await api.systemInfoGet()));
  }, "systemInfoGet");

export const fetchWifiStatus = (): AppThunk => async dispatch =>
  withTryCatch(async () => {
    const logs = await api.logPackage({ id: wifiName });
    const firstLogLine = logs.trim().split("\n")[0];
    const running = !firstLogLine.includes("No interface found");
    dispatch(updateWifiStatus({ running }));
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
