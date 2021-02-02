import { PortScanResponse } from "../types";
import { getPortsScan } from "../utils/getPortsScan";
import * as db from "../db";

export async function portsScanGet(): Promise<PortScanResponse[]> {
  const packagePort = db.portsToOpen.get();
  // udp ports cannot be scanned
  // as a better approach, if tcp ports were opened with UpNp, udp quite probably were opened as well
  const tcpPorts = packagePort.filter(port => port.protocol === "TCP");
  const ports = tcpPorts.map(port => port.portNumber.toString());
  const publicIp = db.publicIp.get();

  return await getPortsScan({
    publicIp,
    ports
  });
}
