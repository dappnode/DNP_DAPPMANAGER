import { LocalProxyingStatus, Routes } from "@dappnode/common";
import { pause } from "./utils/pause";

const localProxyingStatusON: LocalProxyingStatus = "running";
const localProxyingStatusOFF: LocalProxyingStatus = "stopped";
let localProxyingStatus: LocalProxyingStatus = localProxyingStatusON;

export const localProxying: Pick<
  Routes,
  "localProxyingEnableDisable" | "localProxyingStatusGet"
> = {
  localProxyingEnableDisable: async enable => {
    await pause(2000);
    localProxyingStatus = enable
      ? localProxyingStatusON
      : localProxyingStatusOFF;
  },
  localProxyingStatusGet: async () => localProxyingStatus
};
