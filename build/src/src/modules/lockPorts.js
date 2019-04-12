const parse = require("utils/parse");
const dockerList = require("modules/dockerList");
const docker = require("modules/docker");
const getPath = require("utils/getPath");
const params = require("params");

/**
 * The goal of this module is to find out which port
 * was assign by docker to the p2p ephemeral ports,
 * and write that port to the docker-compose. The goal
 * is to "lock" that port and prevent the port from
 * changing when the package is reseted.
 *
 * It will convert this sample docker-compose:
 *
 * version: '3.4'
 * services:
 *     kovan.dnp.dappnode.eth:
 *         ports:
 *             - '30303/udp'
 *             - '30303'
 *
 * into this:
 *
 * version: '3.4'
 * services:
 *     kovan.dnp.dappnode.eth:
 *         ports:
 *             - '32769:30303/udp'
 *             - '32769:30303'
 *
 */

//
// FORMAT INFO
//

/**
 * dnpList =
 *   [
 *     {
 *       name: "ipfs.dnp.dappnode.eth",
 *       ports: [
 *         {
 *           "IP": "0.0.0.0"
 *           "PrivatePort": 5000, // container port
 *           "PublicPort": 32769, // host port
 *           "Type": "tcp"
 *         },
 *         ...
 *       ],
 *       ...
 *     },
 *     ...
 *   ]
 */

/**
 * dc = { version: '3.4',
 *  services:
 *   { 'ipfs.dnp.dappnode.eth':
 *      { container_name: 'DAppNodeCore-ipfs.dnp.dappnode.eth',
 *        image: 'ipfs.dnp.dappnode.eth:0.1.0',
 *        ports: [ '4001:4001', '4002:4002/udp', '5000' ],
 *        dns: '172.33.1.2' } },
 *  volumes: { export: {}, data: {} },
 *  networks: { network: { driver: 'bridge', ipam: [Object] } } }
 */

/**
 * Edits docker-compose of a package to lock ephemeral ports
 * Must be run after a `docker-compose up` on the last step of the installation
 * @param {object} pkg {name, ver, manifest}
 * @returns {array} portsToOpen = [ {number: 32769, type: 'UDP'}, ... ]
 */
async function lockPorts({ pkg, dockerComposePath }) {
  // Load the docker compose
  if (pkg) {
    // First, check if the package has ephemeral ports (to skip quicly if necessary)
    const manifestPorts = ((pkg.manifest || {}).image || {}).ports || [];
    if (!manifestPorts.filter(port => !(port || "").includes(":")).length) {
      // No ephemeral ports on this package, returns no portsToOpen
      return [];
    }
    dockerComposePath = getPath.dockerCompose(
      pkg.name,
      params,
      pkg.manifest.isCore
    );
  } else if (dockerComposePath) {
    //
  } else {
    throw Error(
      "lockPorts first argument must be an object with either a pkg or a dockerComposePath"
    );
  }

  const dc = parse.readDockerCompose(dockerComposePath);
  let name = Object.getOwnPropertyNames(dc.services)[0];
  let dcPorts = dc.services[name].ports;
  if (!Array.isArray(dcPorts)) {
    throw Error(
      `${name}'s docker-compose's image ports is not an array: ${dcPorts}`
    );
  }
  if (!dcPorts.filter(port => !(port || "").includes(":")).length) {
    throw Error(
      `${name}'s docker-compose's image ports has no expected ephemeral ports`
    );
  }

  // Get the current state of the package to know which port was chosen by docker
  const dnpList = await dockerList.listContainers();
  const dnp = dnpList.find(_dnp => _dnp.name && _dnp.name.includes(name));
  if (!dnp) {
    throw Error(
      `No DNP was found for name ${name}, so its ports cannot be checked`
    );
  }
  if (!dnp.ports.length) {
    throw Error(`${name}'s container's ports array has length 0`);
  }

  // Track and return host ports in case they have to be openned
  const portsToOpen = [];

  // the dcPorts array are only ports that do not include ":",
  // port = "5000"
  // port = "5000/udp"
  dcPorts = dcPorts.map(portString => {
    if (portString.includes(":")) {
      return portString;
    }

    let [portNumber, portType = "tcp"] = portString.split("/");
    if (isNaN(portNumber)) {
      throw Error(
        `Port declared in ${name} docker-compose, must be num : ${portNumber}`
      );
    }
    const dnpListPort = dnp.ports.find(
      p =>
        // portNumber or p.PrivatePort may be of type integer
        String(p.PrivatePort) === String(portNumber) && portType === p.Type
    );
    if (!dnpListPort) {
      throw Error(
        `Port ${portString} of ${name} not in ${JSON.stringify(dnp.ports)}`
      );
    }

    // Store the host port in the ports to open array
    portsToOpen.push({
      number: dnpListPort.PublicPort,
      type: portType.toUpperCase()
    });

    // Now convert "30303/udp" to "32769:30303/udp"
    return `${dnpListPort.PublicPort}:${portString}`;
  });

  // Set ports to docker-compose object
  dc.services[name].ports = dcPorts;
  // Add ports to close in the docker-compose labels
  dc.services[name].labels = {
    ...(dc.services[name].labels || {}),
    portsToClose: JSON.stringify(portsToOpen)
  };
  // Write docker-compose
  parse.writeDockerCompose(dockerComposePath, dc);

  // In order to apply the labels to the current container, re-up it
  await docker.compose.up(dockerComposePath);

  // Track and return host ports in case they have to be openned
  return portsToOpen;
}

module.exports = lockPorts;
