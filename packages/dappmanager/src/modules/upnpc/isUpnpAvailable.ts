import { list } from "./list";
import { UpnpError, UPnPErrors } from "./upnpError";

export async function isUpnpAvailable(): Promise<boolean> {
  try {
    await list();
    return true;
  } catch (e) {
    if (e instanceof UpnpError && e.typeUpnpError === UPnPErrors.UPNPNOTAVAIL)
      return false;
    return true;
  }
}
