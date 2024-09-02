import { api } from "api";
import { AppThunk } from "store";
import { dnpInstalledSlice } from "./reducer";

// Service > dnpInstalled

export const setDnpInstalled = dnpInstalledSlice.actions.setDnpInstalled;

// Redux-thunk actions

export const fetchDnpInstalled = (): AppThunk => async (dispatch) => {
  try {
    dispatch(setDnpInstalled(await api.packagesGet()));
  } catch (e) {
    console.error(`Error loading packages`, e);
  }
};
