import { createAction } from "@reduxjs/toolkit";
import { api } from "api";
import { DirectoryItem, RequestStatus } from "types";
import { AppThunk } from "store";

// Service > dnpDirectory

export const setDnpDirectory = createAction<DirectoryItem[]>(
  "dnpDirectory/set"
);

export const updateDnpDirectory = createAction<DirectoryItem[]>(
  "dnpDirectory/update"
);

export const updateStatus = createAction<RequestStatus>(
  "dnpDirectory/updateStatus"
);

// Redux-thunk actions

export const fetchDnpDirectory = (
  isPublic: boolean
): AppThunk => async dispatch => {
  try {
    dispatch(updateStatus({ loading: true }));
    const directory = !isPublic
      ? await api.fetchDirectory()
      : await api.fetchRegistry({ addressOrEnsName: "public.dappnode.eth" });
    // Some items in directory may be undefined
    dispatch(setDnpDirectory(directory.filter(Boolean)));
    dispatch(updateStatus({ loading: false, success: true }));
  } catch (e) {
    dispatch(updateStatus({ loading: false, error: e.message }));
  }
};
