import path from "path";
import { VolumeMappingDocker } from "../../types";

/**
 * Normalizes volume paths, removes trailing slash
 * - "/"                => "/"
 * - "/root/.ethereum/" => "/root/.ethereum"
 * - "data"             => "data"
 */
export function normalizeVolumePath(volumePath: string): string {
  // Remove trailing slash
  if (!volumePath) return "";
  if (volumePath === "/") return volumePath;
  return path.normalize(volumePath.replace(/\/+$/, ""));
}

/**
 * Parses an array of volumes from the service section
 * - Ignores broken volume mappings, where there is no container path
 *   "/host/path:", "/host/path"
 * @param volumesArray
 */
export function parseVolumeMappings(
  volumesArray: string[]
): VolumeMappingDocker[] {
  return volumesArray
    .map(
      (volString): VolumeMappingDocker => {
        const [host, container] = volString
          .split(/:(.*)/)
          .map(normalizeVolumePath);
        const isNamed = !host.startsWith("/") && !host.startsWith("~");
        return {
          host,
          container,
          name: isNamed ? host : undefined
        };
      }
    )
    .filter(({ container }) => container);
}

export function stringifyVolumeMappings(
  volumeMappings: VolumeMappingDocker[]
): string[] {
  return volumeMappings.map(({ name, host, container }) =>
    [name || host, container].join(":")
  );
}
