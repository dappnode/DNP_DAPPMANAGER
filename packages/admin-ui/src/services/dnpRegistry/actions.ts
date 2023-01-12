import { createAction } from "@reduxjs/toolkit";
import { api } from "api";
import { DirectoryItem, RequestStatus } from "@dappnode/common";
import { AppThunk } from "store";

// Service > dnpRegistry

export const setDnpRegistry = createAction<DirectoryItem[]>("dnpRegistry/set");

export const updateDnpRegistry = createAction<DirectoryItem[]>(
  "dnpRegistry/update"
);

export const updateStatus = createAction<RequestStatus>(
  "dnpRegistry/updateStatus"
);

// Redux-thunk actions

export const fetchDnpRegistry = ({
  addressOrEnsName
}: {
  addressOrEnsName?: string;
}): AppThunk => async dispatch => {
  try {
    dispatch(updateStatus({ loading: true }));
    const registry = await api.fetchRegistry({
      addressOrEnsName
    });
    // Some items in registry may be undefined
    dispatch(setDnpRegistry(registry.filter(Boolean)));
    dispatch(updateStatus({ loading: false, success: true }));
  } catch (e) {
    dispatch(updateStatus({ loading: false, error: e.message }));
  }
};
