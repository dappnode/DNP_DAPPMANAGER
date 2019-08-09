const parse = require("utils/parse");
const {
  parsePortMappings,
  stringifyPortMappings
} = require("utils/dockerComposeParsers");

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
async function unlockPorts(dockerComposePath) {
  if (typeof dockerComposePath !== "string") {
    throw Error(
      `First argument (dockerComposePath) of unlockPorts must be String: ${JSON.stringify(
        dockerComposePath
      )}`
    );
  }

  // 1. Parse docker-compose to find portsToClose.
  const dc = parse.readDockerCompose(dockerComposePath);
  // Create shortcut to the first service
  const service = dc.services[Object.getOwnPropertyNames(dc.services)[0]];
  if (!service) {
    const dcString = JSON.stringify(dc, null, 2);
    throw Error(
      `Broken docker-compose (${dockerComposePath}), on unlockPorts: \n${dcString}`
    );
  }

  // 2. Reset the docker-compose to make them epheremal again
  service.ports = stringifyPortMappings(
    parsePortMappings(service.ports).map(portMapping => {
      const { host, container, protocol } = portMapping;
      return host && parseInt(host) >= ephemeralPortRange
        ? { container, protocol }
        : portMapping;
    })
  );

  // 3. Write the docker-compose (no need to up the package)
  dc.services[Object.getOwnPropertyNames(dc.services)[0]] = service;
  parse.writeDockerCompose(dockerComposePath, dc);
}

module.exports = unlockPorts;
