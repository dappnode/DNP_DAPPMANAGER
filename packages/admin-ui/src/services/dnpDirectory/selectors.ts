import { RootState } from "rootReducer";

// Service > dnpDirectory

export const getDnpDirectory = (state: RootState) =>
  state.dnpDirectory.directory;
export const getDirectoryRequestStatus = (state: RootState) =>
  state.dnpDirectory.requestStatus || {};
