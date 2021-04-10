import fetch from "node-fetch";
import params from "../../params";
import Ajv from "ajv";
import { PackagePort } from "../../common";
import { logs } from "../../logs";

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
    const response = await fetch(
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
function sanitizeApiResponse(response: any): PortScanResponse {
  //If the keyword value is an object, then for the data array to be valid
  // each item of the array should be valid according to the schema in this value.
  // In this case the additionalItems keyword is ignored.
  const schema = {
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

  if (ajv.validate(schema, response)) {
    const responseSanitized = response as PortScanResponse;
    return responseSanitized;
  }
  throw Error("Error: API response not validated by the schema");
}
