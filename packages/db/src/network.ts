import { dbMain } from "./dbFactory.js";
import { interceptGlobalEnvOnSet } from "./intercepGlobalEnvOnSet.js";

const NO_NAT_LOOPBACK = "no-nat-loopback";
const DOUBLE_NAT = "double-nat";
const ALERT_TO_OPEN_PORTS = "alert-to-open-ports";
const INTERNAL_IP = "internal-ip";
const AVAHI_SHOULD_BE_DISABLED = "avahi-should-be-disabled";

export const noNatLoopback = interceptGlobalEnvOnSet(
  dbMain.staticKey<boolean>(NO_NAT_LOOPBACK, false),
  Object.keys({ NO_NAT_LOOPBACK })[0]
);
export const doubleNat = dbMain.staticKey<boolean>(DOUBLE_NAT, false);
export const alertToOpenPorts = dbMain.staticKey<boolean>(
  ALERT_TO_OPEN_PORTS,
  false
);
export const internalIp = interceptGlobalEnvOnSet(
  dbMain.staticKey<string>(INTERNAL_IP, ""),
  Object.keys({ INTERNAL_IP })[0]
);

export const avahiPublishCmdShouldNotRun = dbMain.staticKey<boolean>(
  AVAHI_SHOULD_BE_DISABLED,
  false
);
