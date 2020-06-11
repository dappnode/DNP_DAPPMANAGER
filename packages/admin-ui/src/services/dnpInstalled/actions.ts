import { api } from "api";
import { AppThunk } from "store";
import { dnpInstalledSlice } from "./reducer";

// Service > dnpInstalled

export const setDnpInstalled = dnpInstalledSlice.actions.setDnpInstalled;
const updateStatus = dnpInstalledSlice.actions.updateStatus;

// Redux-thunk actions

export const fetchDnpInstalled = (): AppThunk => async dispatch => {
  try {
    dispatch(updateStatus({ loading: true }));
    dispatch(setDnpInstalled(await api.listPackages()));
    dispatch(updateStatus({ loading: false, success: true }));
  } catch (e) {
    dispatch(updateStatus({ loading: false, error: e.message }));
  }
};
