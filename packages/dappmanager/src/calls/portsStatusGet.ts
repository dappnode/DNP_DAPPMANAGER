import * as db from "@dappnode/db";
import { list } from "@dappnode/upnpc";
import { logs } from "@dappnode/logger";
import { PortToOpen, UpnpTablePortStatus, ApiTablePortStatus, UpnpPortMapping, PackagePort } from "@dappnode/types";
import { params } from "@dappnode/params";
import Ajv from "ajv";

// If the keyword value is an object, then for the data array to be valid
// each item of the array should be valid according to the schema in this value.
// In this case the additionalItems keyword is ignored.
const checkPortsResponseSchema = {
  type: "object",
  maxProperties: 2,
  additionalProperties: false,
  properties: {
    tcpPorts: {
      uniqueItems: true,
      type: "array",
      items: {
        type: "object",
        maxProperties: 3,
        minProperties: 2,
        additionalProperties: false,
        required: ["port", "status"],
        properties: {
          port: {
            type: "integer",
            minimum: 0,
            maximum: 65535
          },
          status: {
            type: "string",
            pattern: "^(open|closed|error|unknown)$"
          },
          message: {
            type: "string"
          }
        }
      }
    },
    udpPorts: {
      uniqueItems: true,
      type: "array",
      items: {
        type: "object",
        maxProperties: 3,
        minProperties: 2,
        additionalProperties: false,
        required: ["port", "status"],
        properties: {
          port: {
            type: "integer",
            minimum: 0,
            maximum: 65535
          },
          status: {
            type: "string",
            pattern: "^(open|closed|error|unknown)$"
          },
          message: {
            type: "string"
          }
        }
      }
    }
  }
};

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
async function performPortsScan({
  publicIp,
  portsToOpen
}: {
  publicIp: string;
  portsToOpen: PackagePort[];
}): Promise<PortScanResult[]> {
  const tcpPorts = portsToOpen
    .filter((port) => port.protocol === "TCP")
    .map((port) => port.portNumber.toString())
    .join(",");

  try {
    const response = await fetch(`${apiEndpoint}/${publicIp}?tcpPorts=${tcpPorts}`);

    const responseJson = await response.json();
    const responseJsonSanitized = sanitizeApiResponse(responseJson);

    return responseJsonSanitized.tcpPorts;
  } catch (e) {
    // Returns ports with status "error" when an error occurs fetching the API
    logs.error(`Error fetching port scanner ${e.message}`);
    return tcpPorts.split(",").map((tcpPort) => {
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

// API calls

/**
 * API call that returns the ports status to be displayed in the ports table
 * using UPnP. It is called from the UI only if upnp is enabled
 */
export async function portsUpnpStatusGet({
  portsToOpen
}: {
  portsToOpen: PortToOpen[];
}): Promise<UpnpTablePortStatus[]> {
  const upnpPortMappings: UpnpPortMapping[] = await list(); // Ports opened, mapped with UPnP

  return portsToOpen.map((port) => ({
    port: port.portNumber,
    protocol: port.protocol,
    dnpName: port.dnpName,
    serviceName: port.serviceName,
    status: upnpPortMappings.find((upnpPort) => parseInt(upnpPort.inPort) === port.portNumber) ? "open" : "closed"
  }));
}

/**
 * API call that returns the ports status to be displayed in the ports table
 * using API scan service
 */
export async function portsApiStatusGet({ portsToOpen }: { portsToOpen: PortToOpen[] }): Promise<ApiTablePortStatus[]> {
  const apiTcpPortsStatus = await performPortsScan({
    publicIp: db.publicIp.get(),
    portsToOpen
  });

  return portsToOpen.map((port) => {
    const tcpPort =
      port.protocol === "TCP" ? apiTcpPortsStatus.find((tcpPort) => tcpPort.port === port.portNumber) : undefined;
    return {
      port: port.portNumber,
      protocol: port.protocol,
      dnpName: port.dnpName,
      serviceName: port.serviceName,
      status: tcpPort ? tcpPort.status : "unknown",
      message: tcpPort ? tcpPort.message : undefined
    };
  });
}
