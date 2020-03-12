import { staticKey, dynamicKeyValidate } from "./dbMain";
import { EthClientStatus, EthClientTarget, UserSettings } from "../types";
import { joinWithDot, stripDots } from "./dbUtils";

const SERVER_NAME = "server-name";
const ETH_CLIENT_TARGET = "eth-client-target";
const ETH_CLIENT_STATUS = "eth-client-status";
const ETH_CLIENT_STATUS_ERROR = "eth-client-status-error";
const ETH_CLIENT_USER_SETTINGS = "eth-client-user-settings";
const FULLNODE_DOMAIN_TARGET = "fullnode-domain-target";

export const serverName = staticKey<string>(SERVER_NAME, "");

export const ethClientTarget = staticKey<EthClientTarget>(
  ETH_CLIENT_TARGET,
  "remote"
);
export const ethClientStatus = staticKey<EthClientStatus>(
  ETH_CLIENT_STATUS,
  "selected"
);
export const ethClientStatusError = staticKey<string | undefined>(
  ETH_CLIENT_STATUS_ERROR,
  undefined
);

const ethClientUserSettingsKeyGetter = (target: EthClientTarget): string =>
  joinWithDot(ETH_CLIENT_USER_SETTINGS, stripDots(target));
const ethClientUserSettingsValidate = (
  id: string,
  userSettings?: UserSettings
): boolean => typeof id === "string" && typeof userSettings === "object";

export const ethClientUserSettings = dynamicKeyValidate<
  UserSettings,
  EthClientTarget
>(ethClientUserSettingsKeyGetter, ethClientUserSettingsValidate);

export function setEthClientStatusAndError(
  status: EthClientStatus,
  e?: Error
): void {
  ethClientStatus.set(status);
  ethClientStatusError.set(e ? e.message : undefined);
}

// Domains

export const fullnodeDomainTarget = staticKey<string>(
  FULLNODE_DOMAIN_TARGET,
  ""
);
