import { ContainerInfo } from "dockerode";
import params from "../../../params";
import {
  PackageContainer,
  VolumeMapping,
  ContainerState,
  PortProtocol,
  PortMapping
} from "../../../types";
import {
  parseEnvironment,
  parsePortMappings,
  parseVolumeMappings,
  readContainerLabels
} from "../../compose";
import { multiaddressToGatewayUrl } from "../../../utils/distributedFile";
import { isPortMappingDeletable } from "./isPortMappingDeletable";
import { parseExitCodeFromStatus } from "./parseExitCodeFromStatus";

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;
const networkName = params.DNP_NETWORK_EXTERNAL_NAME;
const allowedFullnodeDnpNames = params.ALLOWED_FULLNODE_DNP_NAMES;

export function parseContainerInfo(container: ContainerInfo): PackageContainer {
  const labels = readContainerLabels(container.Labels);

  const containerName = (container.Names[0] || "").replace("/", "");
  const dnpName =
    labels.dnpName ||
    containerName.split(CONTAINER_NAME_PREFIX)[1] ||
    containerName.split(CONTAINER_CORE_NAME_PREFIX)[1];

  const defaultEnvironment =
    labels.defaultEnvironment && parseEnvironment(labels.defaultEnvironment);
  const defaultPorts =
    labels.defaultPorts && parsePortMappings(labels.defaultPorts);
  const defaultVolumes =
    labels.defaultVolumes && parseVolumeMappings(labels.defaultVolumes);
  const dockerTimeout = labels.dockerTimeout;

  const state = container.State as ContainerState;
  const exitCode = parseExitCodeFromStatus(container.Status);

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
    ip:
      container.NetworkSettings &&
      container.NetworkSettings.Networks &&
      container.NetworkSettings.Networks[networkName]
        ? container.NetworkSettings.Networks[networkName].IPAddress
        : undefined,
    ports: container.Ports.map(
      ({ PrivatePort, PublicPort, Type }): PortMapping => ({
        // "PublicPort" will be undefined / null / 0 if the port is not mapped
        ...(PublicPort ? { host: PublicPort } : {}),
        container: PrivatePort,
        protocol: (Type === "udp" ? "UDP" : "TCP") as PortProtocol
      })
    ).map(
      (port): PortMapping => ({
        ...port,
        deletable: isPortMappingDeletable(port, defaultPorts)
      })
    ),
    volumes: container.Mounts.map(
      ({ Name, Source, Destination }): VolumeMapping => ({
        host: Source, // "/var/lib/docker/volumes/nginxproxydnpdappnodeeth_vhost.d/_data",
        container: Destination, // "/etc/nginx/vhost.d"
        // "Name" will be undefined if it's not a named volumed
        ...(Name ? { name: Name } : {}) // "nginxproxydnpdappnodeeth_vhost.d"
      })
    ),

    state,
    running: state === "running",
    exitCode,

    // Additional package metadata to avoid having to read the manifest
    dependencies: labels.dependencies || {},
    avatarUrl: labels.avatar ? multiaddressToGatewayUrl(labels.avatar) : "",
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
