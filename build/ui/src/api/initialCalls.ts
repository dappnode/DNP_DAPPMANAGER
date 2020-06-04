import { store } from "../store";
import { fetchDnpInstalled } from "services/dnpInstalled/actions";
import { fetchCoreUpdateData } from "services/coreUpdate/actions";
import {
  fetchSystemInfo,
  fetchVolumes,
  fetchPasswordIsInsecure,
  fetchWifiStatus
} from "services/dappnodeStatus/actions";

export function initialCallsOnOpen() {
  store.dispatch<any>(fetchDnpInstalled());
  store.dispatch<any>(fetchCoreUpdateData());
  store.dispatch<any>(fetchSystemInfo());
  store.dispatch<any>(fetchVolumes());
  store.dispatch<any>(fetchPasswordIsInsecure());
  store.dispatch<any>(fetchWifiStatus());
}
