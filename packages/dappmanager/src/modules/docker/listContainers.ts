import { ContainerInfo } from "dockerode";
import { pick } from "lodash";
import { dockerList } from "./dockerApi";
import params from "../../params";
import {
  PackageContainer,
  InstalledPackageData,
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
 * Return containers grouped by parent package. Necessary for multi-service packages
 */
export async function listPackages(): Promise<InstalledPackageData[]> {
  const containers = await listContainers();
  const dnps = new Map<string, InstalledPackageData>();
  for (const container of containers) {
    dnps.set(container.dnpName, {
      ...pick(container, [
        "dnpName",
        "instanceName",
        "version",
        "isDnp",
        "isCore",
        "dependencies",
        "avatarUrl",
        "origin",
        "chain",
        "domainAlias",
        "canBeFullnode"
      ]),
      containers: [
        ...(dnps.get(container.dnpName)?.containers || []),
        container
      ]
    });
  }
  return Array.from(dnps.values());
}

export async function listPackageNoThrow({
  dnpName
}: {
  dnpName: string;
}): Promise<InstalledPackageData | null> {
  if (!dnpName) throw Error(`Falsy dnpName: ${dnpName}`);
  const dnps = await listPackages();
  return dnps.find(d => d.dnpName === dnpName) || null;
}

export async function listPackage({
  dnpName
}: {
  dnpName: string;
}): Promise<InstalledPackageData> {
  const dnp = await listPackageNoThrow({ dnpName });
  if (!dnp) throw Error(`No DNP was found for name ${dnpName}`);
  return dnp;
}

/**
 * Returns the list of containers
 * [NOTE] On a full DAppNode will 14 containers the call takes 17ms on average
 * @returns
 */
export async function listContainers(): Promise<PackageContainer[]> {
  const containers = await dockerList({});

  return containers
    .map(parseContainerInfo)
    .filter(pkg => pkg.isDnp || pkg.isCore);
}

export async function listContainerNoThrow({
  containerName
}: {
  containerName: string;
}): Promise<PackageContainer | null> {
  const containers = await dockerList({ filters: { name: [containerName] } });
  // When querying "geth.dnp.dappnode.eth", if user has "goerli-geth.dnp.dappnode.eth"
  // The latter can be returned as the original container.
  // Return an exact match for
  // - containerName "DAppNodePackage-geth.dnp.dappnode.eth"
  // - name: "geth.dnp.dappnode.eth"
  const matches = containers
    .map(parseContainerInfo)
    .filter(container => container.containerName === containerName);
  if (matches.length > 1)
    throw Error(`Multiple matches found for ${containerName}`);
  return matches[0] || null;
}

export async function listContainer({
  containerName
}: {
  containerName: string;
}): Promise<PackageContainer> {
  const container = await listContainerNoThrow({ containerName });
  if (!container) throw Error(`${containerName} package not found`);
  return container;
}

function parseContainerInfo(container: ContainerInfo): PackageContainer {
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
    state: container.State as ContainerState,
    running: (container.State as ContainerState) === "running",

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
  defaultPorts: PortMapping[] | undefined
): boolean {
  return (
    // Assume if no defaultPorts they were empty, so all ports = deletable
    !Array.isArray(defaultPorts) ||
    !defaultPorts.find(
      defaultPort =>
        defaultPort.container == port.container &&
        defaultPort.protocol == port.protocol
    )
  );
}
