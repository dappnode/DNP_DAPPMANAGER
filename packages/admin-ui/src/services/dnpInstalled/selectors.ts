import { RootState } from "rootReducer";
import { InstalledPackageData } from "@dappnode/types";

// Service > dnpInstalled

export const getDnpInstalled = (state: RootState): InstalledPackageData[] => state.dnpInstalled.dnpInstalled;
