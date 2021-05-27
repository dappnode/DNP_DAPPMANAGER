import {
  LocalProxyingStatus,
  AvahiPublishCmdStatusType,
  Routes
} from "../common";
import { pause } from "./utils/pause";

const localProxyingStatusON: LocalProxyingStatus = {
  localProxyingEnabled: true,
  avahiPublishCmdState: { status: AvahiPublishCmdStatusType.started }
};
const localProxyingStatusOFF: LocalProxyingStatus = {
  localProxyingEnabled: false,
  avahiPublishCmdState: {
    status: AvahiPublishCmdStatusType.crashed,
    error: `Error: Something unexpected has occurred.
  at main (/Users/Me/Documents/MyApp/app.js:9:15)
  at Object. (/Users/Me/Documents/MyApp/app.js:17:1)
  at Module._compile (module.js:460:26)
  at Object.Module._extensions..js (module.js:478:10)`
  }
};
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
