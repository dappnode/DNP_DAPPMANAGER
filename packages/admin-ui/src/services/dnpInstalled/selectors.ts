import { RootState } from "rootReducer";
import { InstalledPackageData } from "types";

// Service > dnpInstalled

export const getDnpInstalled = (state: RootState): InstalledPackageData[] =>
  state.dnpInstalled.dnpInstalled;
