import fetch from "node-fetch";
import assert from "assert";
import { logs } from "../logs";
import params from "../params";
import { PortScanResponse } from "../types";

const apiEndpoint = params.PORT_SCANNER_SERVICE_URL;

export async function performPortsScan({
  publicIp,
  tcpPorts
}: {
  publicIp: string;
  tcpPorts: string;
}): Promise<PortScanResponse[]> {
  try {
    const response = await fetch(
      `${apiEndpoint}/${publicIp}?tcpPorts=${tcpPorts}`
    );
    const responseJson = await response.json();
    sanitizeApiResponse(responseJson);
    return responseJson;
  } catch (e) {
    logs.error(`Error fetching port scanner ${e.message}`);

    // Returns ports with status "unknown" when an error occurs fetching the API
    return tcpPorts.split(",").map(tcpPort => {
      return {
        tcpPort: parseInt(tcpPort),
        status: "unknown"
      };
    });
  }
}

/**
 * Check if the response from the scan ports API
 * is well formatted
 */
function sanitizeApiResponse(responseJson: PortScanResponse[]): void {
  assert.deepStrictEqual(
    responseJson.some((route: PortScanResponse) =>
      Object.keys(route).some(key => key !== "tcpPort" && key !== "status")
    ),
    false,
    "API response returned wrong key JSON"
  );
  assert.deepStrictEqual(
    responseJson.some(
      (route: PortScanResponse) => typeof route.tcpPort !== "number"
    ),
    false,
    "API response returned port different than number"
  );
  assert.deepStrictEqual(
    responseJson.some(
      (route: PortScanResponse) =>
        route.status !== "closed" && route.status !== "open"
    ),
    false,
    "API response returned status different than open or closed"
  );
}
