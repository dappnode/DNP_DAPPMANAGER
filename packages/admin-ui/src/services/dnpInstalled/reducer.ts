import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InstalledPackageData } from "@dappnode/types";

// Service > dnpInstalled

export const dnpInstalledSlice = createSlice({
  name: "dnpInstalled",
  initialState: {
    dnpInstalled: []
  } as {
    dnpInstalled: InstalledPackageData[];
  },
  reducers: {
    setDnpInstalled: (state, action: PayloadAction<InstalledPackageData[]>) => ({
      ...state,
      dnpInstalled: action.payload
    })
  }
});

export const reducer = dnpInstalledSlice.reducer;
