import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PackageContainer, RequestStatus } from "common/types";

// Service > dnpInstalled

export const dnpInstalledSlice = createSlice({
  name: "dnpInstalled",
  initialState: {
    dnpInstalled: [],
    requestStatus: {}
  } as {
    dnpInstalled: PackageContainer[];
    requestStatus: RequestStatus;
  },
  reducers: {
    setDnpInstalled: (state, action: PayloadAction<PackageContainer[]>) => ({
      ...state,
      dnpInstalled: action.payload
    }),

    updateStatus: (state, action: PayloadAction<RequestStatus>) => ({
      ...state,
      requestStatus: action.payload
    })
  }
});

export const reducer = dnpInstalledSlice.reducer;
