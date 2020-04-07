import * as dbMain from "./dbMain";
import * as dbCache from "./dbCache";
import {
  EthClientTarget,
  UserSettings,
  EthClientFallback,
  EthClientStatus
} from "../types";
import { joinWithDot, stripDots } from "./dbUtils";
import { EthClientInstallStatus } from "../modules/ethClient/types";
import * as eventBus from "../eventBus";

// User chosen properties
const ETH_CLIENT_TARGET = "eth-client-target";
const ETH_CLIENT_FALLBACK = "eth-client-fallback";
const ETH_CLIENT_USER_SETTINGS = "eth-client-user-settings";
// Cached status
const ETH_CLIENT_INSTALL_STATUS = "eth-client-install-status";
const ETH_CLIENT_STATUS = "eth-client-status";
const ETH_PROVIDER_URL = "eth-provider-url";

// Re-export to consider the first value (when it's not set)
// but do not allow to set null again. Using to express intentionality
const _ethClientTarget = interceptOnSet(
  dbMain.staticKey<EthClientTarget | null>(ETH_CLIENT_TARGET, null)
);
export const ethClientTarget = {
  get: _ethClientTarget.get,
  set: (newValue: EthClientTarget) => _ethClientTarget.set(newValue)
};

export const ethClientFallback = interceptOnSet(
  dbMain.staticKey<EthClientFallback>(ETH_CLIENT_FALLBACK, "off")
);

// Persist the user settings of each client
// This is necessary if there was a migration and the settings have to
// be kept after switching between clients

const ethClientUserSettingsKeyGetter = (target: EthClientTarget): string =>
  joinWithDot(ETH_CLIENT_USER_SETTINGS, stripDots(target));
const ethClientUserSettingsValidate = (
  id: string,
  userSettings?: UserSettings
): boolean => typeof id === "string" && typeof userSettings === "object";

export const ethClientUserSettings = dbMain.dynamicKeyValidate<
  UserSettings,
  EthClientTarget
>(ethClientUserSettingsKeyGetter, ethClientUserSettingsValidate);

// Cached status, not critical

/**
 * Cache the status of the eth client install loop
 */
export const ethClientInstallStatus = interceptOnSet(
  dbCache.dynamicKeyValidate<EthClientInstallStatus, EthClientTarget>(
    (target: EthClientTarget): string =>
      joinWithDot(ETH_CLIENT_INSTALL_STATUS, stripDots(target)),
    (id: string, installStatus?: EthClientInstallStatus): boolean =>
      typeof id === "string" && typeof installStatus === "object"
  )
);

/**
 * Cache the general status of the eth client, if it's available or not
 */
export const ethClientStatus = interceptOnSet(
  dbCache.dynamicKeyValidate<EthClientStatus, EthClientTarget>(
    (target: EthClientTarget): string =>
      joinWithDot(ETH_CLIENT_STATUS, stripDots(target)),
    (id: string, status?: EthClientStatus): boolean =>
      typeof id === "string" && typeof status === "object"
  )
);

export const ethProviderUrl = interceptOnSet(
  dbCache.staticKey<string>(ETH_PROVIDER_URL, "")
);

/**
 * Intercept all on set methods to request an update to the UI
 * @param dbSetter
 */
function interceptOnSet<F extends Function, T extends { set: F }>(
  dbSetter: T
): T {
  return {
    ...dbSetter,
    set: function(...args: any[]) {
      dbSetter.set(...args);
      eventBus.requestSystemInfo.emit();
    }
  };
}
