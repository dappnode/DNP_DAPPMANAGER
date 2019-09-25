import { staticKey } from "./lowLevelDb";
import { UpnpPortMapping } from "../modules/upnpc/types";
import { PackagePort } from "../types";

const UPNP_AVAILABLE = "upnp-available";
const UPNP_PORT_MAPPINGS = "upnp-port-mappings";
const PORTS_TO_OPEN = "ports-to-ppen";

export const upnpAvailable = staticKey<boolean>(UPNP_AVAILABLE, false);

export const upnpPortMappings = staticKey<UpnpPortMapping[]>(
  UPNP_PORT_MAPPINGS,
  []
);

export const portsToOpen = staticKey<PackagePort[]>(PORTS_TO_OPEN, []);
