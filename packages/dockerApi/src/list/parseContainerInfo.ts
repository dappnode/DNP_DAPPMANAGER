import fs from "fs";
import { ContainerInfo } from "dockerode";
import { params } from "@dappnode/params";
import { PackageContainer, VolumeMapping, ContainerState } from "@dappnode/types";
import { parsePortMappings, parseVolumeMappings, readContainerLabels } from "@dappnode/dockercompose";
import { parseExitCodeFromStatus } from "./parseExitCodeFromStatus.js";
import { ensureUniquePortsFromDockerApi } from "../utils.js";
import { fileToGatewayUrl, getAvatarPath, normalizeHash, parseEnvironment } from "@dappnode/utils";

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;
const allowedFullnodeDnpNames = params.ALLOWED_FULLNODE_DNP_NAMES;

export function parseContainerInfo(container: ContainerInfo): PackageContainer {
  const labels = readContainerLabels(container.Labels);

  const containerName = (container.Names[0] || "").replace("/", "");
  const dnpName = labels.dnpName || parseDnpNameFromContainerName(containerName);

  const defaultEnvironment = labels.defaultEnvironment && parseEnvironment(labels.defaultEnvironment);
  const defaultPorts = labels.defaultPorts && parsePortMappings(labels.defaultPorts);
  const defaultVolumes = labels.defaultVolumes && parseVolumeMappings(labels.defaultVolumes);
  const dockerTimeout = labels.dockerTimeout;

  const state = container.State as ContainerState;
  const exitCode = parseExitCodeFromStatus(container.Status);

  const containerNetworks = container.NetworkSettings?.Networks || {};
  const networks = Object.entries(containerNetworks).map(([networkName, network]) => ({
    name: networkName,
    ip: network.IPAddress
    // NOTE: /containers/json will always return Aliases: null even if there are aliases
    // aliases: network.Aliases || []
  }));
  // Declared here for reusability purposes
  const isDnp = Boolean(labels.dnpName) || containerName.includes(CONTAINER_NAME_PREFIX);
  const isCore = typeof labels.isCore === "boolean" ? labels.isCore : containerName.includes(CONTAINER_CORE_NAME_PREFIX);

  return {
    // Identification
    containerId: container.Id,
    containerName,
    serviceName: labels.serviceName || container.Labels["com.docker.compose.service"],
    instanceName: labels.instanceName || "",
    dnpName,
    version: labels.version || (container.Image || "").split(":")[1] || "0.0.0",
    isDnp,
    isCore,

    // Docker data
    created: container.Created,
    image: container.Image,
    ip: containerNetworks[params.DOCKER_PRIVATE_NETWORK_NAME]?.IPAddress,
    privateIp: containerNetworks[params.DOCKER_PRIVATE_NETWORK_NEW_NAME]?.IPAddress,
    ports: container.Ports && ensureUniquePortsFromDockerApi(container.Ports, defaultPorts), // on MacOS docker API might return null for ports
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
    avatarUrl: resolveAvatarUrl(labels.avatar, dnpName, isCore),
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

/**
 * Resolves an avatar label value to a usable URL.
 * Prefers a locally-downloaded avatar file when one exists on disk.
 * Otherwise falls back to the remote IPFS gateway or HTTP mirror URL.
 * @param avatar - The raw Docker label value ("/ipfs/Qm..." or HTTP URL). May be empty.
 * @param dnpName - Package name, used to locate the local avatar file.
 * @param isCore - Whether the package is a core DAppNode package.
 * @returns A URL string that can be used to fetch the avatar image.
 */
export function resolveAvatarUrl(avatar: string | undefined, dnpName: string, isCore: boolean): string {
  // Prefer locally-downloaded avatar if it exists on disk
  try {
    const localPath = getAvatarPath(dnpName, isCore);
    if (fs.existsSync(localPath)) return `/avatars/${dnpName}.png`;
  } catch {
    // Ignore filesystem errors — fall through to remote resolution
  }

  if (!avatar) return "";
  if (avatar.startsWith("http")) return avatar; // Avatar URL is already an HTTP URL. Package was likely installed from mirror
  return fileToGatewayUrl({ source: "ipfs", hash: normalizeHash(avatar), size: 0 }); // Convert IPFS multiaddress to a gateway URL.
}
