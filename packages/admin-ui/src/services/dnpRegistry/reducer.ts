import { keyBy } from "lodash";
import { createReducer } from "@reduxjs/toolkit";
import { setDnpRegistry, updateDnpRegistry, updateStatus } from "./actions";
import { RequestStatus, RegistryItem } from "common/types";

// Service > dnpDirectory

export const reducer = createReducer<{
  registry: RegistryItem[];
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
