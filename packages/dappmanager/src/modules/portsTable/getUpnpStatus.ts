import { PackagePort, UpnpPortMapping } from "../../common";

/**
 * UPnP:
 * 1.UPnP available AND port open => "open"
 * 2.UPnP available AND port closed => "closed"
 * 3.UPnP not available => "unknown"
 */
export function getUpnpStatus({
  port,
  upnpAvailable,
  upnpPortMappings
}: {
  port: PackagePort;
  upnpAvailable: boolean;
  upnpPortMappings: UpnpPortMapping[];
}): "open" | "closed" | "unknown" {
  return !upnpAvailable
    ? "unknown"
    : upnpPortMappings.some(
        upnpPort => parseInt(upnpPort.inPort) === port.portNumber
      )
    ? "open"
    : "closed";
}
