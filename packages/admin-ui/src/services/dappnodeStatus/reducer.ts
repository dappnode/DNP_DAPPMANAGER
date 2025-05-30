import { mapValues } from "lodash-es";
import { SystemInfo, VolumeData } from "@dappnode/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WifiCredentials } from "types";

// Service > dappnodeStatus

export interface DappnodeStatusState {
  systemInfo: SystemInfo | null;
  wifiCredentials: WifiCredentials | null;
  /**
   * Will trigger alerts when it's a boolean and false, x === false
   * Must be null at start
   */
  volumes: VolumeData[];
  shouldShowSmooth: boolean | null;
}

const initialState: DappnodeStatusState = {
  systemInfo: null,
  wifiCredentials: null,
  volumes: [],
  shouldShowSmooth: null
};

export const dappnodeStatus = createSlice({
  name: "dappnodeStatus",
  initialState,
  reducers: mapValues(
    initialState,
    (data, key) => (state: typeof initialState, action: PayloadAction<typeof data>) => ({
      ...state,
      [key]: action.payload
    })
  ) as {
    [K in keyof DappnodeStatusState]: (
      state: DappnodeStatusState,
      action: PayloadAction<DappnodeStatusState[K]>
    ) => DappnodeStatusState;
  }
});

export const reducer = dappnodeStatus.reducer;
