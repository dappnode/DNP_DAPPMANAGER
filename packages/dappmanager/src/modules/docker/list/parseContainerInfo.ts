import { ContainerInfo } from "dockerode";
import params from "../../../params";
import {
  PackageContainer,
  VolumeMapping,
  ContainerState
} from "@dappnode/common";
import {
  parseEnvironment,
  parsePortMappings,
  parseVolumeMappings,
  readContainerLabels
} from "../../compose";
import { multiaddressToIpfsGatewayUrl } from "../../../utils/distributedFile";
import { parseExitCodeFromStatus } from "./parseExitCodeFromStatus";
import { ensureUniquePortsFromDockerApi } from "../utils";

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;
const allowedFullnodeDnpNames = params.ALLOWED_FULLNODE_DNP_NAMES;

export function parseContainerInfo(container: ContainerInfo): PackageContainer {
  const labels = readContainerLabels(container.Labels);

  const containerName = (container.Names[0] || "").replace("/", "");
  const dnpName =
    labels.dnpName || parseDnpNameFromContainerName(containerName);

  const defaultEnvironment =
    labels.defaultEnvironment && parseEnvironment(labels.defaultEnvironment);
  const defaultPorts =
    labels.defaultPorts && parsePortMappings(labels.defaultPorts);
  const defaultVolumes =
    labels.defaultVolumes && parseVolumeMappings(labels.defaultVolumes);
  const dockerTimeout = labels.dockerTimeout;

  const state = container.State as ContainerState;
  const exitCode = parseExitCodeFromStatus(container.Status);

  const containerNetworks = container.NetworkSettings?.Networks || {};
  const networks = Object.entries(containerNetworks).map(
    ([networkName, network]) => ({
      name: networkName,
      ip: network.IPAddress
      // NOTE: /containers/json will always return Aliases: null even if there are aliases
      // aliases: network.Aliases || []
    })
  );

  return {
    // Identification
    containerId: container.Id,
    containerName,
    serviceName:
      labels.serviceName || container.Labels["com.docker.compose.service"],
    instanceName: labels.instanceName || "",
    dnpName,
    version: labels.version || (container.Image || "").split(":")[1] || "0.0.0",
    isDnp:
      Boolean(labels.dnpName) || containerName.includes(CONTAINER_NAME_PREFIX),
    isCore:
      typeof labels.isCore === "boolean"
        ? labels.isCore
        : containerName.includes(CONTAINER_CORE_NAME_PREFIX),

    // Docker data
    created: container.Created,
    image: container.Image,
    ip: containerNetworks[params.DNP_PRIVATE_NETWORK_NAME]?.IPAddress,
    ports: ensureUniquePortsFromDockerApi(container.Ports, defaultPorts),
    volumes: container.Mounts.map(
      ({ Name, Source, Destination }): VolumeMapping => ({
        host: Source, // "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
        container: Destination, // "/etc/nginx/vhost.d"
        // "Name" will be undefined if it's not a named volumed
        ...(Name ? { name: Name } : {}) // "nginxproxydnpdappnodeeth_vhost.d"
      })
    ),
    networks,

    state,
    running: state === "running",
    exitCode,

    // Additional package metadata to avoid having to read the manifest
    dependencies: labels.dependencies || {},
    avatarUrl: labels.avatar ? multiaddressToIpfsGatewayUrl(labels.avatar) : "",
    origin: labels.origin,
    chain: labels.chain,
    canBeFullnode: allowedFullnodeDnpNames.includes(dnpName),
    isMain: labels.isMain,
    // Default settings on the original package version's docker-compose
    defaultEnvironment,
    defaultPorts,
    defaultVolumes,
    dockerTimeout
  };
}

/**
 * Parse dnpName from containerName considering multi-service packages
 * @param containerName DAppNodeCore-api.wireguard.dnp.dappnode.eth
 * @returns wireguard.dnp.dappnode.eth
 */
export function parseDnpNameFromContainerName(containerName: string): string {
  const containerDomain =
    containerName.split(CONTAINER_NAME_PREFIX)[1] ||
    containerName.split(CONTAINER_CORE_NAME_PREFIX)[1] ||
    containerName;

  if (containerDomain.endsWith(".dappnode.eth")) {
    // Structure: service . nameShort . repo . dappnode . eth
    // Example: api.wireguard.dnp.dappnode.eth
    const parts = containerDomain.trim().split(".");
    return parts.slice(-4).join("."); // Grab the 4 last parts, which ignores the service name
  } else {
    return containerDomain;
  }
}
