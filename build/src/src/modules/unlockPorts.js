const parse = require("utils/parse");

/**
 * Unlocks locked ephemeral ports of stopped container
 * 1. Read docker-compose, parse portsToClose
 * 2. For each portsToClose, remove its port bindings
 * 3. Write the docker-compose (no need to up the package)
 *
 * Used when trying to up a container and its ports collide
 * @param {String} dockerComposePath
 * @return {Array} portsToClose = [ {number: 32769, type: 'UDP'}, ... ]
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
    throw Error(
      `Broken docker-compose (${dockerComposePath}) found while solving a port conflict: \n${JSON.stringify(
        dc,
        null,
        2
      )}`
    );
  }
  const portsToCloseString = (service.labels || {}).portsToClose;
  const portsToClose = portsToCloseString ? JSON.parse(portsToCloseString) : [];
  if (!portsToClose.length) {
    // This package has no locked ephemeral ports, so there is no way to solve it
    return [];
  }

  // 2. Reset the docker-compose to make them epheremal again
  // portsToClose: '[{"number":32768,"type":"UDP"},{"number":32768,"type":"TCP"}]'
  service.ports = service.ports.map(portString => {
    if (!portString.includes(":")) return portString;
    const [portHost, portContainer] = portString.split(":");
    const [, portType = "tcp"] = portContainer.split("/");
    const isPortLocked = portsToClose.find(
      p =>
        String(p.number) === String(portHost) &&
        p.type.toLowerCase() === portType.toLowerCase()
    );
    return isPortLocked ? portString.split(":")[1] : portString;
  });
  // Clean labels
  delete (service.labels || {}).portsToClose;
  if (!Object.keys(service.labels).length) {
    delete service.labels;
  }

  // 3. Write the docker-compose (no need to up the package)
  dc.services[Object.getOwnPropertyNames(dc.services)[0]] = service;
  parse.writeDockerCompose(dockerComposePath, dc);

  // Return portsToClose to be closed by UPnP if necessary
  return portsToClose;
}

module.exports = unlockPorts;
