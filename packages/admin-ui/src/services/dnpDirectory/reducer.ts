import { keyBy } from "lodash-es";
import { createReducer } from "@reduxjs/toolkit";
import { setDnpDirectory, updateDnpDirectory, updateStatus } from "./actions";
import { DirectoryItem, RequestStatus } from "@dappnode/common";

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
      ...keyBy(state.directory, dnp => dnp.name),
      ...keyBy(action.payload, dnp => dnp.name)
    })
  }));

  builder.addCase(updateStatus, (state, action) => ({
    ...state,
    requestStatus: action.payload
  }));
});
