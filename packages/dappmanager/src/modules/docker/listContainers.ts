import { dockerList } from "./dockerApi";
import { ContainerInfo } from "dockerode";
import { shortName } from "../../utils/format";
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
  readDefaultsFromLabels,
  readMetadataFromLabels
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
      container => container.packageName === byName || container.name === byName
    );
  if (matches.length > 1) throw Error(`Multiple matches found for ${byName}`);
  return matches[0] || null;
}

export async function listContainer(byName: string): Promise<PackageContainer> {
  const container = await listContainerNoThrow(byName);
  if (!container) throw Error(`${byName} package not found`);
  return container;
}

// export async function listContainerByContainerId(
//   byContainerId: string
// ): Promise<PackageContainer> {
//   const filters: ListContainersFilters = { id: byContainerId };
//   const containers = await dockerApi.listContainers({ all: true, filters });
//   const container = containers[0];
//   if (!container)
//     if (!container) throw Error(`No DNP was found for id ${byContainerId}`);
//   return parseContainerInfo(container);
// }

function parseContainerInfo(container: ContainerInfo): PackageContainer {
  const packageName = (container.Names[0] || "").replace("/", "");
  const isDnp = packageName.includes(CONTAINER_NAME_PREFIX);
  const isCoreByName = packageName.includes(CONTAINER_CORE_NAME_PREFIX);

  let name = "";
  if (isDnp) name = packageName.split(CONTAINER_NAME_PREFIX)[1] || "";
  else if (isCoreByName)
    name = packageName.split(CONTAINER_CORE_NAME_PREFIX)[1] || "";
  else name = packageName;

  let version = (container.Image || "").split(":")[1] || "0.0.0";
  // IPFS path
  if ((version || "").startsWith("ipfs-")) {
    version = version.replace("ipfs-", "/ipfs/");
  }

  const ip =
    container.NetworkSettings &&
    container.NetworkSettings.Networks &&
    container.NetworkSettings.Networks[networkName]
      ? container.NetworkSettings.Networks[networkName].IPAddress
      : undefined;

  // Process dappnode.dnp tags
  //   dappnode.dnp.dependencies
  //   dappnode.dnp.origin
  //   dappnode.dnp.chain
  const labels = container.Labels;
  const defaults = readDefaultsFromLabels(labels);
  const {
    dependencies,
    avatar,
    chain,
    origin,
    isCore
  } = readMetadataFromLabels(labels);
  const defaultEnvironment = defaults.environment
    ? parseEnvironment(defaults.environment)
    : undefined;
  const defaultPorts = defaults.ports
    ? parsePortMappings(defaults.ports)
    : undefined;
  const defaultVolumes = defaults.volumes
    ? parseVolumeMappings(defaults.volumes)
    : undefined;
  const avatarUrl = multiaddressToGatewayUrl(avatar);

  return {
    id: container.Id,
    packageName,
    version,
    isDnp,
    isCore: isCore || isCoreByName,
    created: container.Created,
    image: container.Image,
    name: name,
    shortName: shortName(name),
    ip,
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
        deletable: Boolean(
          defaultPorts &&
            defaultPorts.length > 0 &&
            !defaultPorts.find(
              defaultPort =>
                defaultPort.container == port.container &&
                defaultPort.protocol == port.protocol
            )
        )
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
    running: container.State === "running",
    dependencies,
    avatarUrl,
    origin,
    chain,
    canBeFullnode: allowedFullnodeDnpNames.includes(name),
    // Default values to avoid having to read the manifest
    defaultEnvironment,
    defaultPorts,
    defaultVolumes
  };
}
