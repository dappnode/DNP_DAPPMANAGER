import { createAction } from "@reduxjs/toolkit";
import { api } from "api";
import { DirectoryItem, RequestStatus } from "types";
import { AppThunk } from "store";

// Service > dnpRegistry

export const setDnpRegistry = createAction<{
  registryName: string;
  items: DirectoryItem[];
}>("dnpRegistry/set");

export const updateDnpRegistry = createAction<{
  registryName: string;
  items: DirectoryItem[];
}>("dnpRegistry/update");

export const updateStatus = createAction<{
  registryName: string;
  status: RequestStatus;
}>("dnpRegistry/updateStatus");

// Redux-thunk actions

export const fetchDnpRegistry = ({
  registryName
}: {
  registryName: string;
}): AppThunk => async dispatch => {
  try {
    dispatch(updateStatus({ registryName, status: { loading: true } }));
    const registry = await api.fetchRegistry({ registryName });

    // Some items in registry may be undefined
    dispatch(setDnpRegistry({ registryName, items: registry.filter(Boolean) }));
    dispatch(
      updateStatus({ registryName, status: { loading: false, success: true } })
    );
  } catch (e) {
    dispatch(
      updateStatus({
        registryName,
        status: { loading: false, error: (e as Error).message }
      })
    );
  }
};
