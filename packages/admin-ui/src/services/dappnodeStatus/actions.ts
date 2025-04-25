import { api } from "api";
import { dappnodeStatus } from "./reducer";
import { AppThunk } from "store";

// Service > dappnodeStatus

// Update

export const setSystemInfo = dappnodeStatus.actions.systemInfo;
export const updateVolumes = dappnodeStatus.actions.volumes;
const updateShouldShowSmooth = dappnodeStatus.actions.shouldShowSmooth;

// Fetch

export const fetchShouldShowSmooth = (): AppThunk => async (dispatch) =>
  withTryCatch(async () => {
    dispatch(updateShouldShowSmooth(await api.getShouldShowSmooth()));
  }, "getShouldShowSmooth");

export const fetchVolumes = (): AppThunk => async (dispatch) =>
  withTryCatch(async () => {
    dispatch(updateVolumes(await api.volumesGet()));
  }, "volumesGet");

export const fetchSystemInfo = (): AppThunk => async (dispatch) =>
  withTryCatch(async () => {
    dispatch(setSystemInfo(await api.systemInfoGet()));
  }, "systemInfoGet");

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
