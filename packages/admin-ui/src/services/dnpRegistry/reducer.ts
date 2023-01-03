import { keyBy } from "lodash-es";
import { createReducer } from "@reduxjs/toolkit";
import { setDnpRegistry, updateDnpRegistry, updateStatus } from "./actions";
import { DirectoryItem, RequestStatus } from "@dappnode/common";

// Service > dnpRegistry

export const reducer = createReducer<{
  registry: DirectoryItem[];
  requestStatus: RequestStatus;
}>({ registry: [], requestStatus: {} }, builder => {
  builder.addCase(setDnpRegistry, (state, action) => ({
    ...state,
    registry: action.payload
  }));

  builder.addCase(updateDnpRegistry, (state, action) => ({
    ...state,
    registry: Object.values({
      ...keyBy(state.registry, dnp => dnp.name),
      ...keyBy(action.payload, dnp => dnp.name)
    })
  }));

  builder.addCase(updateStatus, (state, action) => ({
    ...state,
    requestStatus: action.payload
  }));
});
