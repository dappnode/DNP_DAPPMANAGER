import { staticKey } from "./dbMain";

const NO_NAT_LOOPBACK = "no-nat-loopback";
const DOUBLE_NAT = "double-nat";
const ALERT_TO_OPEN_PORTS = "alert-to-open-ports";
const INTERNAL_IP = "internal-ip";

export const noNatLoopback = staticKey<boolean>(NO_NAT_LOOPBACK, false);
export const doubleNat = staticKey<boolean>(DOUBLE_NAT, false);
export const alertToOpenPorts = staticKey<boolean>(ALERT_TO_OPEN_PORTS, false);
export const internalIp = staticKey<string>(INTERNAL_IP, "");
