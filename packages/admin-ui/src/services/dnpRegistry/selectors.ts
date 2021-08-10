import { RootState } from "rootReducer";
import { orderBy } from "lodash";

// Service > dnpRegistry

export const getDnpRegistry = (state: RootState) =>
  orderBy(state.dnpRegistry.registry, item => item.index, ["asc"]);
export const getRegistryRequestStatus = (state: RootState) =>
  state.dnpRegistry.requestStatus || {};
