import { PortScanResponse } from "../types";
import { performPortsScan } from "../utils/performPortsScan";
import * as db from "../db";

export async function portsScanGet(): Promise<PortScanResponse[]> {
  const packagePort = db.portsToOpen.get();
  // udp ports cannot be scanned
  // as a better approach, if tcp ports were opened with UPnP, udp quite probably were opened as well
  const tcpPorts = packagePort
    .filter(port => port.protocol === "TCP")
    .map(port => port.portNumber.toString())
    .join(",");
  const publicIp = db.publicIp.get();

  return await performPortsScan({
    publicIp,
    tcpPorts
  });
}
