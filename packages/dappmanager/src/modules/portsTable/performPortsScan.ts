import fetch from "node-fetch";
import assert from "assert";
import params from "../../params";
import { PortScanResult, PortScanResponse, PackagePort } from "../../common";
import { logs } from "../../logs";

const apiEndpoint = params.PORT_SCANNER_SERVICE_URL;

/**
 * Fetch check ports scan service for TCP ports
 */
export async function performPortsScan({
  publicIp,
  portsToOpen
}: {
  publicIp: string;
  portsToOpen: PackagePort[];
}): Promise<PortScanResult[]> {
  const tcpPorts = portsToOpen
    .filter(port => port.protocol === "TCP")
    .map(port => port.portNumber.toString())
    .join(",");

  try {
    const response = await fetch(
      `${apiEndpoint}/${publicIp}?tcpPorts=${tcpPorts}`
    );

    const responseJson = await response.json();
    sanitizeApiResponse(responseJson);

    return responseJson.tcpPorts;
  } catch (e) {
    // Returns ports with status "error" when an error occurs fetching the API
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
    responseJson.tcpPorts.some((route: PortScanResult) =>
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
      (route: PortScanResult) => typeof route.port !== "number"
    ),
    false,
    "API response returned port different than number"
  );
  // ports status check
  assert.deepStrictEqual(
    responseJson.tcpPorts.some(
      (route: PortScanResult) =>
        route.status !== "closed" &&
        route.status !== "open" &&
        route.status !== "error" &&
        route.status !== "unknown"
    ),
    false,
    "API response returned status different than open or closed"
  );
}
