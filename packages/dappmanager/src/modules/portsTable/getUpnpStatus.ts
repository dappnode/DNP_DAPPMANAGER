import { PackagePort, UpnpPortMapping, UpnpStatus } from "../../common";

/**
 * UPnP:
 * 1.UPnP available AND port open => "open"
 * 2.UPnP available AND port closed => "closed"
 * 3.UPnP not available => "upnp-disabled"
 */
export function getUpnpStatus({
  port,
  upnpAvailable,
  upnpPortMappings
}: {
  port: PackagePort;
  upnpAvailable: boolean;
  upnpPortMappings: UpnpPortMapping[];
}): UpnpStatus {
  return upnpAvailable
    ? upnpPortMappings.some(
        upnpPort => parseInt(upnpPort.inPort) === port.portNumber
      )
      ? "open"
      : "closed"
    : "upnp-disabled";
}
