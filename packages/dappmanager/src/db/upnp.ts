import { dbCache } from "./dbFactory";
import { UpnpPortMapping } from "../modules/upnpc/types";
import { PackagePort } from "../types";

const UPNP_AVAILABLE = "upnp-available";
const UPNP_PORT_MAPPINGS = "upnp-port-mappings";
const PORTS_TO_OPEN = "ports-to-ppen";
const IS_NAT_RENEWAL_ENABLED = "is-nat-renewal-enabled";

export const upnpAvailable = dbCache.staticKey<boolean>(UPNP_AVAILABLE, false);

export const upnpPortMappings = dbCache.staticKey<UpnpPortMapping[]>(
  UPNP_PORT_MAPPINGS,
  []
);

export const portsToOpen = dbCache.staticKey<PackagePort[]>(PORTS_TO_OPEN, []);

export const isNatRenewalEnabled = dbCache.staticKey<boolean>(
  IS_NAT_RENEWAL_ENABLED,
  true
);
