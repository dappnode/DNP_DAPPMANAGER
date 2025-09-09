import { RootState } from "rootReducer";

// Service > coreUpdate

export const getCoreUpdateData = (state: RootState) => state.coreUpdate.data;
export const getUpdatingCore = (state: RootState) => state.coreUpdate.updatingCore;
export const getCoreRequestStatus = (state: RootState) => state.coreUpdate.requestStatus;

export const getCoreUpdateAvailable = (state: RootState): boolean => {
  const coreUpdateData = getCoreUpdateData(state);
  return coreUpdateData !== null && coreUpdateData.available;
};
