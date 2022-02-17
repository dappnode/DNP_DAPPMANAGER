import { RootState } from "rootReducer";
import { orderBy } from "lodash";

// Service > dnpRegistry

export const getDnpRegistry = (state: RootState, registryName: string) =>
  orderBy(state.dnpRegistry[registryName]?.registry ?? [], item => item.index, [
    "asc"
  ]);

export const getRegistryRequestStatus = (
  state: RootState,
  registryName: string
) => state.dnpRegistry[registryName]?.requestStatus || {};
