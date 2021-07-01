import isIp from "is-ip";
import upnpcCommand from "./upnpcCommand";
import { parseUpnpErrors } from "./upnpError";

export default async function getExternalIp(): Promise<string> {
  try {
    const res = await upnpcCommand("-l");
    const externalIp = ((res || "").match(
      /ExternalIPAddress.=.((\d+\.?){4})/
    ) || [])[1];
    if (isIp(externalIp)) return externalIp;
    else throw Error("Wrong IP");
  } catch (e) {
    const upnpError = parseUpnpErrors(e.message);
    e.message = `Error getting external IP: ${e.message}`;
    throw upnpError;
  }
}
