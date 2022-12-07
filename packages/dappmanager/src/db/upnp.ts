import { dbCache } from "./dbFactory";
import { UpnpPortMapping } from "../modules/upnpc/types";
import { PackagePort } from "../types";
import { interceptGlobalEnvOnSet } from "./interceptGlobalEnvOnSet";
import { dbKeys } from "./dbUtils";

export const upnpAvailable = interceptGlobalEnvOnSet(
  dbCache.staticKey<boolean>(dbKeys.UPNP_AVAILABLE, false),
  "UPNP_AVAILABLE"
);

export const upnpPortMappings = dbCache.staticKey<UpnpPortMapping[]>(
  dbKeys.UPNP_PORT_MAPPINGS,
  []
);

export const portsToOpen = dbCache.staticKey<PackagePort[]>(
  dbKeys.PORTS_TO_OPEN,
  []
);

export const isNatRenewalDisabled = dbCache.staticKey<boolean>(
  dbKeys.IS_NAT_RENEWAL_DISABLED,
  false
);
