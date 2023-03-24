import fetch from "node-fetch";
import params from "../../params.js";
import Ajv from "ajv";
import { PackagePort } from "@dappnode/common";
import { logs } from "../../logs.js";
import { checkPortsResponseSchema } from "./schema.js";

interface PortScanResponse {
  tcpPorts: PortScanResult[];
  udpPorts: PortScanResult[];
}

interface PortScanResult {
  port: number;
  status: "open" | "closed" | "error" | "unknown";
  message?: string;
}

const apiEndpoint = params.PORT_SCANNER_SERVICE_URL;

const ajv = new Ajv({ allErrors: true });

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
    const response = await fetch.default(
      `${apiEndpoint}/${publicIp}?tcpPorts=${tcpPorts}`
    );

    const responseJson = await response.json();
    const responseJsonSanitized = sanitizeApiResponse(responseJson);

    return responseJsonSanitized.tcpPorts;
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
function sanitizeApiResponse(response: unknown): PortScanResponse {
  if (!ajv.validate(checkPortsResponseSchema, response)) {
    throw Error(`Invalid response: ${JSON.stringify(ajv.errors, null, 2)}`);
  }
  return response as PortScanResponse;
}
