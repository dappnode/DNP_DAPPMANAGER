import { RootState } from "rootReducer";
import { InstalledPackageData } from "types";

// Service > dnpInstalled

export const getDnpInstalled = (state: RootState): InstalledPackageData[] =>
  state.dnpInstalled.dnpInstalled;

/**
 * Regular selectors, called outside of a normal react-redux situation
 */

export const getDnpInstalledByDnpName = (state: RootState, dnpName: string) =>
  getDnpInstalled(state).find(dnp => dnp.dnpName === dnpName);
