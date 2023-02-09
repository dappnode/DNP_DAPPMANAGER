import { mapValues } from "lodash-es";
import { SystemInfo, VolumeData } from "@dappnode/common";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WifiCredentials } from "types";

// Service > dappnodeStatus

interface DappnodeStatusState {
  systemInfo: SystemInfo | null;
  wifiCredentials: WifiCredentials | null;
  /**
   * Will trigger alerts when it's a boolean and false, x === false
   * Must be null at start
   */
  passwordIsSecure: boolean | null;
  volumes: VolumeData[];
}

const initialState: DappnodeStatusState = {
  systemInfo: null,
  wifiCredentials: null,
  passwordIsSecure: null,
  volumes: []
};

export const dappnodeStatus = createSlice({
  name: "dappnodeStatus",
  initialState,
  reducers: mapValues(
    initialState,
    (data, key) => (
      state: typeof initialState,
      action: PayloadAction<typeof data>
    ) => ({ ...state, [key]: action.payload })
  ) as {
    [K in keyof DappnodeStatusState]: (
      state: DappnodeStatusState,
      action: PayloadAction<DappnodeStatusState[K]>
    ) => DappnodeStatusState;
  }
});

export const reducer = dappnodeStatus.reducer;
