import { createAction } from "@reduxjs/toolkit";
import { api } from "api";
import { DirectoryItem, RequestStatus } from "types";
import { AppThunk } from "store";

// Service > dnpDirectory

export const setDnpDirectory = createAction<DirectoryItem[]>(
  "dnpDirectory/set"
);

export const updateStatus = createAction<RequestStatus>(
  "dnpDirectory/updateStatus"
);

// Redux-thunk actions

export const fetchDnpDirectory = (): AppThunk => async dispatch => {
  try {
    dispatch(updateStatus({ loading: true }));
    dispatch(setDnpDirectory(await api.fetchDirectory()));
    dispatch(updateStatus({ loading: false, success: true }));
  } catch (e) {
    dispatch(updateStatus({ loading: false, error: e.message }));
  }
};
