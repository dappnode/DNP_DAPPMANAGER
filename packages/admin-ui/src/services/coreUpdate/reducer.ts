import { mapValues } from "lodash";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CoreUpdateData, RequestStatus } from "common/types";

// Service > coreUpdate

interface CoreUpdateState {
  data: CoreUpdateData | null;
  updatingCore: boolean;
  requestStatus: RequestStatus;
}

const initialState: CoreUpdateState = {
  data: null,
  updatingCore: false,
  requestStatus: {}
};

export const coreUpdate = createSlice({
  name: "coreUpdate",
  initialState,
  reducers: mapValues(
    initialState,
    (data, key) => (
      state: typeof initialState,
      action: PayloadAction<typeof data>
    ) => ({ ...state, [key]: action.payload })
  ) as {
    [K in keyof CoreUpdateState]: (
      state: CoreUpdateState,
      action: PayloadAction<CoreUpdateState[K]>
    ) => CoreUpdateState;
  }
});

export const reducer = coreUpdate.reducer;
