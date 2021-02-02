import fetch from "node-fetch";
import params from "../params";
import { PortScanResponse } from "../types";

const apiEndpoint = params.PORT_SCANNER_SERVICE_URL;

export async function getPortsScan({
  publicIp,
  ports
}: {
  publicIp: string;
  ports: string[];
}): Promise<PortScanResponse[]> {
  try {
    const response = await fetch(
      `${apiEndpoint}/${publicIp}?tcpPorts=${ports.join(",")}`
    );
    return await response.json();
  } catch (e) {
    throw Error(`Error fetching port scanner ${e.message}`);
  }
}
