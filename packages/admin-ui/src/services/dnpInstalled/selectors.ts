import { RootState } from "rootReducer";
import { InstalledPackageData } from "@dappnode/common";

// Service > dnpInstalled

export const getDnpInstalled = (state: RootState): InstalledPackageData[] =>
  state.dnpInstalled.dnpInstalled;
