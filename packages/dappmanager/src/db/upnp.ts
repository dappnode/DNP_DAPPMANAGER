import { dbCache } from "./dbFactory.js";
import { UpnpPortMapping } from "../modules/upnpc/types.js";
import { PackagePort } from "@dappnode/common";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet.js";

const UPNP_AVAILABLE = "upnp-available";
const UPNP_PORT_MAPPINGS = "upnp-port-mappings";
const PORTS_TO_OPEN = "ports-to-ppen";
const IS_NAT_RENEWAL_DISABLED = "is-nat-renewal-disabled";

export const upnpAvailable = interceptGlobalEnvOnSet(
  dbCache.staticKey<boolean>(UPNP_AVAILABLE, false),
  Object.keys({ UPNP_AVAILABLE })[0]
);

export const upnpPortMappings = dbCache.staticKey<UpnpPortMapping[]>(
  UPNP_PORT_MAPPINGS,
  []
);

export const portsToOpen = dbCache.staticKey<PackagePort[]>(PORTS_TO_OPEN, []);

export const isNatRenewalDisabled = dbCache.staticKey<boolean>(
  IS_NAT_RENEWAL_DISABLED,
  false
);
