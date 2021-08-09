import { createAction } from "@reduxjs/toolkit";
import { api } from "api";
import { RegistryItem, RequestStatus } from "types";
import { AppThunk } from "store";

// Service > dnpDirectory

export const setDnpRegistry = createAction<RegistryItem[]>("dnpRegistry/set");

export const updateDnpRegistry = createAction<RegistryItem[]>(
  "dnpRegistry/update"
);

export const updateStatus = createAction<RequestStatus>(
  "dnpRegistry/updateStatus"
);

// Redux-thunk actions

export const fetchDnpRegistry = (
  registryEns: string
): AppThunk => async dispatch => {
  try {
    dispatch(updateStatus({ loading: true }));
    const registry = await api.fetchRegistry({ addressOrEnsName: registryEns });
    // Some items in registry may be undefined
    dispatch(setDnpRegistry(registry.filter(Boolean)));
    dispatch(updateStatus({ loading: false, success: true }));
  } catch (e) {
    dispatch(updateStatus({ loading: false, error: e.message }));
  }
};
