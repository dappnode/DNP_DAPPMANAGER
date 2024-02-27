import { mapValues } from "lodash-es";
import { RebootRequiredScript, SystemInfo, VolumeData } from "@dappnode/types";
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
  rebootRequiredScript: RebootRequiredScript | null;
<<<<<<< HEAD
  shouldShowSmooth: boolean | null;
=======
  isConnectedToInternet: boolean | null;
>>>>>>> 9c2a2b370a25d2bdf5356e3058fb4ee4ae13f82e
}

const initialState: DappnodeStatusState = {
  systemInfo: null,
  wifiCredentials: null,
  passwordIsSecure: null,
  volumes: [],
  rebootRequiredScript: null,
<<<<<<< HEAD
  shouldShowSmooth: null
=======
  isConnectedToInternet: null
>>>>>>> 9c2a2b370a25d2bdf5356e3058fb4ee4ae13f82e
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
