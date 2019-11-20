import { Compose } from "../types";
import { parseService, parseServiceName } from "./dockerComposeParsers";

function assertNoSubstitution(s: string): void {
  if (s && s.includes("${")) throw Error(`variable substitution not allowed`);
}

function verifyServiceVolumes(volumes: string[]): void {
  if (!Array.isArray(volumes)) throw Error("service.volumes must be an array");

  for (const vol of volumes) {
    try {
      if (typeof vol !== "string")
        throw Error("service.volumes items must be strings, use short syntax");
      assertNoSubstitution(vol);
      const [host, container] = vol.split(/:(.*)/);
      if (!host) throw Error("volume host not defined");
      if (!container) throw Error("container path not defined");
    } catch (e) {
      throw Error(`Invalid service.volumes item: ${e.message}`);
    }
  }
}

export function verifyCompose(compose: Compose): void {
  const service = parseService(compose);
  const serviceName = parseServiceName(compose);
  try {
    if (service.volumes) verifyServiceVolumes(service.volumes);
  } catch (e) {
    e.message = `${serviceName} validation: ${e.message}`;
    throw e;
  }
}
