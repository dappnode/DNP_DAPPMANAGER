import { list } from "./list.js";
import { UpnpError, UPnPErrors } from "./upnpError.js";

export async function isUpnpAvailable(): Promise<boolean> {
  try {
    await list();
    return true;
  } catch (e) {
    if (
      e instanceof UpnpError &&
      e.typeUpnpError === UPnPErrors.UPNP_NOT_AVAILABLE
    )
      return false;
    return true;
  }
}
