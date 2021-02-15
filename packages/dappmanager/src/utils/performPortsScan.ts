import fetch from "node-fetch";
import assert from "assert";
import { logs } from "../logs";
import params from "../params";
import { PortScanResponse } from "../types";
import { TcpPortScan } from "../common";

const apiEndpoint = params.PORT_SCANNER_SERVICE_URL;

export async function performPortsScan({
  publicIp,
  tcpPorts
}: {
  publicIp: string;
  tcpPorts: string;
}): Promise<TcpPortScan[]> {
  try {
    const response = await fetch(
      `${apiEndpoint}/${publicIp}?tcpPorts=${tcpPorts}`
    );
    const responseJson = await response.json();
    sanitizeApiResponse(responseJson);
    return responseJson.tcpPorts;
  } catch (e) {
    // Returns ports with status "unknown" when an error occurs fetching the API
    // It is an "unknown" instead of "error" state because API not even returned nothing
    logs.error(`Error fetching port scanner ${e.message}`);
    return tcpPorts.split(",").map(tcpPort => {
      return {
        port: parseInt(tcpPort),
        status: "error",
        message: e.message
      };
    });
  }
}

/**
 * Check if the response from the scan ports API
 * is well formatted
 */
function sanitizeApiResponse(responseJson: PortScanResponse): void {
  // Check for keys "tcpPorts" and "udpPorts"
  assert.deepStrictEqual(
    Object.keys(responseJson).some(
      key => key !== "tcpPorts" && key !== "udpPorts"
    ),
    false,
    "API response returned wrong JSON keys"
  );
  // Inside "tcpPorts" check for keys "port", "status", "message"
  assert.deepStrictEqual(
    responseJson.tcpPorts.some((route: TcpPortScan) =>
      Object.keys(route).some(
        key => key !== "port" && key !== "status" && key !== "message"
      )
    ),
    false,
    "API response returned wrong JSON keys"
  );
  // ports must be numbers
  assert.deepStrictEqual(
    responseJson.tcpPorts.some(
      (route: TcpPortScan) => typeof route.port !== "number"
    ),
    false,
    "API response returned port different than number"
  );
  // ports status check
  assert.deepStrictEqual(
    responseJson.tcpPorts.some(
      (route: TcpPortScan) =>
        route.status !== "closed" &&
        route.status !== "open" &&
        route.status !== "error" &&
        route.status !== "unknown"
    ),
    false,
    "API response returned status different than open or closed"
  );
}
