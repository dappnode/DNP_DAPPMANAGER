import { RootState } from "rootReducer";
import { orderBy } from "lodash";

// Service > dnpDirectory

export const getDnpDirectory = (state: RootState) =>
  orderBy(state.dnpDirectory.directory, item => item.index, ["asc"]);
export const getDirectoryRequestStatus = (state: RootState) =>
  state.dnpDirectory.requestStatus || {};
