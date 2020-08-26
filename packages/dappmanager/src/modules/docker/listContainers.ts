import { dockerList } from "./dockerApi";
import { ContainerInfo } from "dockerode";
import params from "../../params";
import {
  PackageContainer,
  VolumeMapping,
  ContainerState,
  PortProtocol,
  PortMapping
} from "../../types";
import {
  parseEnvironment,
  parsePortMappings,
  parseVolumeMappings,
  readContainerLabels
} from "../compose";
import { multiaddressToGatewayUrl } from "../../utils/distributedFile";

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;
const networkName = params.DNP_NETWORK_EXTERNAL_NAME;
const allowedFullnodeDnpNames = params.ALLOWED_FULLNODE_DNP_NAMES;

/**
 * Returns the list of containers
 * [NOTE] On a full DAppNode will 14 containers the call takes 17ms on average
 * @returns {array}
 */
export async function listContainers(): Promise<PackageContainer[]> {
  const containers = await dockerList({});

  return containers
    .map(parseContainerInfo)
    .filter(pkg => pkg.isDnp || pkg.isCore);
}

export async function listContainerNoThrow(
  byName: string
): Promise<PackageContainer | null> {
  const containers = await dockerList({ filters: { name: [byName] } });
  // When querying "geth.dnp.dappnode.eth", if user has "goerli-geth.dnp.dappnode.eth"
  // The latter can be returned as the original container.
  // Return an exact match for
  // - containerName "DAppNodePackage-geth.dnp.dappnode.eth"
  // - name: "geth.dnp.dappnode.eth"
  const matches = containers
    .map(parseContainerInfo)
    .filter(
      container =>
        container.containerName === byName || container.packageName === byName
    );
  if (matches.length > 1) throw Error(`Multiple matches found for ${byName}`);
  return matches[0] || null;
}

export async function listContainer(byName: string): Promise<PackageContainer> {
  const container = await listContainerNoThrow(byName);
  if (!container) throw Error(`${byName} package not found`);
  return container;
}

function parseContainerInfo(container: ContainerInfo): PackageContainer {
  const labels = readContainerLabels(container.Labels);

  const containerName = (container.Names[0] || "").replace("/", "");
  const packageName =
    labels.packageName ||
    containerName.split(CONTAINER_NAME_PREFIX)[1] ||
    containerName.split(CONTAINER_CORE_NAME_PREFIX)[1];

  const defaultEnvironment =
    labels.defaultEnvironment && parseEnvironment(labels.defaultEnvironment);
  const defaultPorts =
    labels.defaultPorts && parsePortMappings(labels.defaultPorts);
  const defaultVolumes =
    labels.defaultVolumes && parseVolumeMappings(labels.defaultVolumes);

  return {
    // Identification
    containerId: container.Id,
    containerName,
    serviceName:
      labels.serviceName || container.Labels["com.docker.compose.service"],
    instanceName: labels.instanceName,
    packageName,
    version: labels.version || (container.Image || "").split(":")[1] || "0.0.0",
    isDnp:
      Boolean(labels.packageName) ||
      containerName.includes(CONTAINER_NAME_PREFIX),
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
    state: container.State as ContainerState,
    running: (container.State as ContainerState) === "running",

    // Additional package metadata to avoid having to read the manifest
    dependencies: labels.dependencies,
    avatarUrl: multiaddressToGatewayUrl(labels.avatar),
    origin: labels.origin,
    chain: labels.chain,
    canBeFullnode: allowedFullnodeDnpNames.includes(packageName),
    // Default settings on the original package version's docker-compose
    defaultEnvironment,
    defaultPorts,
    defaultVolumes
  };
}

/**
 * Utility to mark a port mapping as deletable in the admin UI
 * Only ports that are known to be added by the user will be deletable
 * @param port
 * @param defaultPorts
 */
function isPortMappingDeletable(
  port: PortMapping,
  defaultPorts: PortMapping[]
): boolean {
  return Boolean(
    defaultPorts &&
      defaultPorts.length > 0 &&
      !defaultPorts.find(
        defaultPort =>
          defaultPort.container == port.container &&
          defaultPort.protocol == port.protocol
      )
  );
}
