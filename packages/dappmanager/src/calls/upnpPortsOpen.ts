import getPortsToOpen from "../daemons/natRenewal/getPortsToOpen";
import * as upnpc from "../modules/upnpc";
import { listContainers } from "../modules/docker/list";
import getLocalIp from "../utils/getLocalIp";

export async function upnpPortsOpen(): Promise<void> {
  try {
    const localIp = await getLocalIp();
    if (!localIp) throw Error("localIp not detected");
    const containers = await listContainers();
    const portsToOpen = getPortsToOpen(containers);
    for (const portToOpen of portsToOpen) {
      await upnpc.open(portToOpen, localIp);
    }
  } catch (e) {
    e.message = `Error on upnpPortsOpen: ${e}`;
    throw e;
  }
}
