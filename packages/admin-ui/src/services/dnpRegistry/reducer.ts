import { keyBy } from "lodash";
import { createReducer } from "@reduxjs/toolkit";
import { setDnpRegistry, updateDnpRegistry, updateStatus } from "./actions";
import { DirectoryItem, RequestStatus } from "common/types";

// Service > dnpRegistry

type RegistryName = string;

/**
 * Empty state
 * `{ registry: [], requestStatus: {} }`
 */
type RegistryState = {
  registry: DirectoryItem[];
  requestStatus: RequestStatus;
};

export const reducer = createReducer<Record<RegistryName, RegistryState>>(
  {},
  builder => {
    builder.addCase(setDnpRegistry, (state, action) => ({
      ...state,
      [action.payload.registryName]: {
        ...state[action.payload.registryName],
        registry: action.payload.items
      }
    }));

    builder.addCase(updateDnpRegistry, (state, action) => ({
      ...state,
      [action.payload.registryName]: {
        ...state[action.payload.registryName],
        registry: Object.values({
          ...keyBy(
            state[action.payload.registryName]?.registry ?? [],
            dnp => dnp.dnpName
          ),
          ...keyBy(action.payload.items, dnp => dnp.dnpName)
        })
      }
    }));

    builder.addCase(updateStatus, (state, action) => ({
      ...state,
      [action.payload.registryName]: {
        ...state[action.payload.registryName],
        requestStatus: action.payload.status
      }
    }));
  }
);
