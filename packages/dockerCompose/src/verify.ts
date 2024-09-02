import { Compose } from "@dappnode/types";
import { applyRecursivelyToStringValues } from "@dappnode/utils";
import { parsePortMappings } from "./ports.js";

// Docker params
// Max port number (included) Otherwise it fails with
// Cannot create container for service ipfs.dnp.dappnode.eth: invalid port specification: "65536"
const maxPortNumber = 65535;

export function verifyCompose(compose: Compose): void {
  for (const serviceName in compose.services) {
    const service = compose.services[serviceName];
    try {
      if (service.volumes) verifyServiceVolumes(service.volumes);
      if (service.ports) verifyServicePorts(service.ports);
    } catch (e) {
      e.message = `${serviceName} validation: ${e.message}`;
      throw e;
    }
  }

  // Make sure there is no variable substitution in the compose
  assertNoSubstitution(compose);
}

function verifyServiceVolumes(volumes: string[]): void {
  if (!Array.isArray(volumes)) throw Error("service.volumes must be an array");

  for (const vol of volumes) {
    try {
      if (typeof vol !== "string") throw Error("service.volumes items must be strings, use short syntax");
      const [host, container] = vol.split(/:(.*)/);
      if (!host) throw Error("volume host not defined");
      if (!container) throw Error("container path not defined");
    } catch (e) {
      throw Error(`Invalid service.volumes '${vol}': ${e.message}`);
    }
  }
}

function verifyServicePorts(ports: string[]): void {
  if (!Array.isArray(ports)) throw Error("service.ports must be an array");

  const portMappings = parsePortMappings(ports);
  for (const portMapping of portMappings) {
    if (portMapping.container > maxPortNumber)
      throw Error(`Port mapping container ${portMapping.container} is over the max ${maxPortNumber}`);
    if (portMapping.host && portMapping.host > maxPortNumber)
      throw Error(`Port mapping host ${portMapping.host} is over the max ${maxPortNumber}`);
  }
}

/**
 * Throws if variable substitution is found at any depth of the compose object
 * ```yaml
 * volumes: ${NOT_ALLOWED}
 * ```
 */
const assertNoSubstitution = applyRecursivelyToStringValues((value, key) => {
  if (value.includes("${")) throw Error(`variable substitution not allowed: '${key}': '${value}'`);
  return value;
});
