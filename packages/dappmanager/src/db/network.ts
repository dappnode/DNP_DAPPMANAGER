import { dbMain } from "./dbFactory";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";
import { dbKeys } from "./dbUtils";

export const noNatLoopback = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(dbKeys.NO_NAT_LOOPBACK, false),
  "NO_NAT_LOOPBACK"
);
export const doubleNat = dbMain.staticKey<boolean>(dbKeys.DOUBLE_NAT, false);
export const alertToOpenPorts = dbMain.staticKey<boolean>(
  dbKeys.ALERT_TO_OPEN_PORTS,
  false
);
export const internalIp = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(dbKeys.INTERNAL_IP, ""),
  "INTERNAL_IP"
);

export const avahiPublishCmdShouldNotRun = dbMain.staticKey<boolean>(
  dbKeys.AVAHI_SHOULD_BE_DISABLED,
  false
);
