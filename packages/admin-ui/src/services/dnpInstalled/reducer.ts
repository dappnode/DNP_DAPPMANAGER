import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PackageContainer } from "common/types";

// Service > dnpInstalled

export const dnpInstalledSlice = createSlice({
  name: "dnpInstalled",
  initialState: {
    dnpInstalled: []
  } as {
    dnpInstalled: PackageContainer[];
  },
  reducers: {
    setDnpInstalled: (state, action: PayloadAction<PackageContainer[]>) => ({
      ...state,
      dnpInstalled: action.payload
    })
  }
});

export const reducer = dnpInstalledSlice.reducer;
