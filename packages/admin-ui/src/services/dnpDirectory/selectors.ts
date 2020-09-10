import { RootState } from "rootReducer";

// Service > dnpDirectory

export const getDnpDirectory = (state: RootState) =>
  state.dnpDirectory.directory.sort((a, b) => a.index - b.index);
export const getDirectoryRequestStatus = (state: RootState) =>
  state.dnpDirectory.requestStatus || {};
