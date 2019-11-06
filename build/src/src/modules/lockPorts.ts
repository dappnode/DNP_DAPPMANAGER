import { dockerComposeUp } from "./docker/dockerCommands";
import {
  getPortMappings,
  mergePortMapping,
  getDockerComposePath
} from "../utils/dockerComposeFile";
import { listContainer } from "./docker/listContainers";
import { PortMapping } from "../types";
import Logs from "../logs";
const logs = Logs(module);

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
 * @returns {array} portsToOpen = [ {portNumber: 32769, protocol: 'UDP'}, ... ]
 */
export default async function lockPorts(id: string): Promise<PortMapping[]> {
  const portMappings = getPortMappings(id);

  const ephemeralPortMappings = portMappings.filter(({ host }) => !host);

  // Check if the package has ephemeral ports (to skip quicly if necessary)
  if (!ephemeralPortMappings.length) return [];

  // Get the current state of the package to know which port was chosen by docker
  const dnp = await listContainer(id);

  // the dcPorts array are only ports that do not include ":",
  // port = "5000"
  // port = "5000/udp"
  const newPortMappings: PortMapping[] = ephemeralPortMappings.map(
    ({ container, protocol }) => {
      // #### FIX THIS: portNumber or p.PrivatePort may be of type integer
      const currentPort = dnp.ports.find(
        p => p.container === container && protocol === p.protocol
      );
      if (!currentPort) {
        throw Error(
          `Port ${id} ${container}/${protocol} not in ${JSON.stringify(
            dnp.ports
          )}`
        );
      }

      // Now convert "30303/udp" to "32769:30303/udp"
      return { host: currentPort.host, container, protocol };
    }
  );

  mergePortMapping(id, newPortMappings);

  // In order to apply the labels to the current container, re-up it
  const dockerComposePath = getDockerComposePath(id);
  await dockerComposeUp(dockerComposePath);

  logs.info(
    `Locked emphemeral ports of ${id}: ${JSON.stringify(newPortMappings)}`
  );

  // Track and return host ports in case they have to be openned
  return newPortMappings;
}
