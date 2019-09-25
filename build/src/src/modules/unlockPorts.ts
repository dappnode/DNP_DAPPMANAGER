import { getPortMappings, setPortMapping } from "../utils/dockerComposeFile";

const ephemeralPortRange = 32768;

/**
 * Unlocks locked ephemeral ports of stopped container
 * 1. Read docker-compose, parse portsToClose
 * 2. For each portsToClose, remove its port bindings
 * 3. Write the docker-compose (no need to up the package)
 *
 * Docker's ephemeral port range: 32768-60999
 *
 * Used when trying to up a container and its ports collide
 * @param {string} dockerComposePath
 */
export default async function unlockPorts(
  dockerComposePath: string
): Promise<void> {
  if (typeof dockerComposePath !== "string") {
    throw Error(
      `First argument (dockerComposePath) of unlockPorts must be String: ${JSON.stringify(
        dockerComposePath
      )}`
    );
  }

  // 1. Parse docker-compose to find portsToClose.
  const portMappings = getPortMappings(dockerComposePath, { isPath: true });
  const newPortMappings = portMappings.map(portMapping => {
    const { host, container, protocol } = portMapping;
    return host && host >= ephemeralPortRange
      ? { container, protocol }
      : portMapping;
  });

  // 2. Reset the docker-compose to make them epheremal again
  setPortMapping(dockerComposePath, newPortMappings, { isPath: true });
}
