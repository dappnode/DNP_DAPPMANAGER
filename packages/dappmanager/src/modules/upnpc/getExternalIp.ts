import isIp from "is-ip";
import upnpcCommand from "./upnpcCommand";
import { UpnpError } from "./upnpError";

export default async function getExternalIp(): Promise<string> {
  const getExternalIpCommand = "-l";
  try {
    const res = await upnpcCommand(getExternalIpCommand);
    const externalIp = ((res || "").match(
      /ExternalIPAddress.=.((\d+\.?){4})/
    ) || [])[1];
    if (isIp(externalIp)) return externalIp;
    else throw Error("Wrong IP");
  } catch (e) {
    e.message = `Error getting external IP: ${e.message}`;
    throw new UpnpError({
      terminalOutput: e.message,
      command: getExternalIpCommand
    });
  }
}
