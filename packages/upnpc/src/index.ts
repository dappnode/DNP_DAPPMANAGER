import { open } from "./open.js";
import { close } from "./close.js";
import { list } from "./list.js";

// upnpc - interact with an external UPnP Internet Gateway Device
//
// setuc [ifn | cname]                      # Host interface to use
//
// upnpc -a ip port external_port tcp | udp # Add port mapping
// upnpc -d external_port tcp | udp         # Delete port mapping
// upnpc -e                                 # External IP address
// upnpc -i                                 # Initialize device list
// upnpc -s                                 # Status
// upnpc -l                                 # List port mappings
// upnpc -n ip                              # Get friendly name
// upnpc -r port1 tcp | udp [...]           # Map these ports to the host interface

// Available commands
// - open
// - close
// - list

export { open, close, list };

export { getExternalUpnpIp } from "./getExternalUpnpIp.js";
export { isUpnpAvailable } from "./isUpnpAvailable.js";
