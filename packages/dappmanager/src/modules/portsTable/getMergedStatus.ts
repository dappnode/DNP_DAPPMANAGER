import {
  ApiStatus,
  UpnpStatus,
  PortProtocol,
  MergedStatus
} from "../../common";

/**
 * Returns the ports status merging API and UPnP status
 * Error will be displayed only in the API status advanced mode.
 */
export function getMergedStatus({
  apiStatus,
  upnpStatus,
  protocol
}: {
  apiStatus: ApiStatus;
  upnpStatus: UpnpStatus;
  protocol: PortProtocol;
}): MergedStatus {
  /**
   * API status:
   * 1.API available AND protocol TCP AND port open => "open"
   * 2.API available AND protocol TCP AND port closed => "closed"
   * 3.API available AND protocol TCP AND port error => "error"
   * 4.API not available OR port not found AND protocol TCP => "unknown"
   */

  /**
   * UPnP status:
   * 1.UPnP available AND port open => "open"
   * 2.UPnP available AND port closed => "closed"
   * 3.UPnP not available => "unknown"
   */

  // The API is not able to scan UDP ports
  if (protocol === "UDP") return upnpStatus;

  switch (apiStatus) {
    case "open":
      return "open";
    case "closed":
      return "closed";
    case "unknown":
      return "unknown";
    case "error":
      return upnpStatus;
  }
}
