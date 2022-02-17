import { keyBy } from "lodash";
import { createReducer } from "@reduxjs/toolkit";
import { setDnpDirectory, updateDnpDirectory, updateStatus } from "./actions";
import { DirectoryItem, RequestStatus } from "common/types";

// Service > dnpDirectory

export const reducer = createReducer<{
  directory: DirectoryItem[];
  requestStatus: RequestStatus;
}>({ directory: [], requestStatus: {} }, builder => {
  builder.addCase(setDnpDirectory, (state, action) => ({
    ...state,
    directory: action.payload
  }));

  builder.addCase(updateDnpDirectory, (state, action) => ({
    ...state,
    directory: Object.values({
      ...keyBy(state.directory, dnp => dnp.dnpName),
      ...keyBy(action.payload, dnp => dnp.dnpName)
    })
  }));

  builder.addCase(updateStatus, (state, action) => ({
    ...state,
    requestStatus: action.payload
  }));
});
