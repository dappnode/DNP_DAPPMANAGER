import {
  ApiStatus,
  UpnpStatus,
  PortProtocol,
  MergedStatus
} from "../../common";

/**
 * Returns the ports status merging API and UPnP status
 * Error will be displayed only in the API status in advanced mode.
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
  // protocol = UDP or isApiScanEnabled = false => upnpStatus
  // (The API is not able to scan UDP ports)
  if (protocol === "UDP" || apiStatus.status === "not-fetched")
    return upnpStatus;

  switch (apiStatus.status) {
    case "open":
      return "open"; // API available AND protocol TCP AND APIport open => "open"
    case "closed":
      return "closed"; // API available AND protocol TCP AND APIport closed => "closed"
    case "unknown":
      return upnpStatus; // API available AND protocol TCP AND APIport not found => "unknown"
    case "error":
      return upnpStatus; // API available AND protocol TCP AND port error => "error"
  }
}
