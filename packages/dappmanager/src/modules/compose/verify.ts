import { Compose as ComposeObj } from "../../types";
import { applyRecursivelyToStringValues } from "../../utils/objects";

export function verifyCompose(compose: ComposeObj): void {
  for (const serviceName in compose.services) {
    const service = compose.services[serviceName];
    try {
      if (service.volumes) verifyServiceVolumes(service.volumes);
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
      if (typeof vol !== "string")
        throw Error("service.volumes items must be strings, use short syntax");
      const [host, container] = vol.split(/:(.*)/);
      if (!host) throw Error("volume host not defined");
      if (!container) throw Error("container path not defined");
    } catch (e) {
      throw Error(`Invalid service.volumes '${vol}': ${e.message}`);
    }
  }
}

/**
 * Throws if variable substitution is found at any depth of the compose object
 * ```yaml
 * volumes: ${NOT_ALLOWED}
 * ```
 */
const assertNoSubstitution = applyRecursivelyToStringValues((value, key) => {
  if (value.includes("${"))
    throw Error(`variable substitution not allowed: '${key}': '${value}'`);
  return value;
});
