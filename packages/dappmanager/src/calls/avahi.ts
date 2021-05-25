import { HttpsLocalProxyingStatus, LocalNetworkState } from "../types";
import { avahiController } from "../daemons/avahi";
import {
  httpsLocalProxyingEnableDisable,
  httpsLocalProxyingGet
} from "./httpsPortal";

/** AVAHI: enable/disable avahi daemon consists in 2 steps:
 * 1. Change HTTPs LOCAL_PROXYING variable
 * 2. Start/stop avahi dameon
 */
export async function avahiEnableDisable(enable: boolean): Promise<void> {
  if (enable) {
    await httpsLocalProxyingEnableDisable(
      `${enable}` as HttpsLocalProxyingStatus
    );
    await avahiController.start();
  } else {
    await httpsLocalProxyingEnableDisable(
      `${enable}` as HttpsLocalProxyingStatus
    );
    avahiController.stop();
  }
}

/** AVAHI: return current status:
 * - starting: avahi is starting (doing first 10 tries) or running for a while
 * - stopped: avahi manually stopped by the user
 * - crashed: avahi crashed due to an error
 */
export async function avahiStatusGet(): Promise<LocalNetworkState> {
  return {
    avahiStatus: avahiController.status.type,
    localProxying: await httpsLocalProxyingGet()
  };
}
