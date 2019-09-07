import { dockerApi } from "./dockerApi";
// dedicated modules
import { shortName } from "../../utils/strings";
import params from "../../params";
import {
  PackageContainer,
  Dependencies,
  VolumeInterface,
  ContainerStatus
} from "../../types";

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;

interface ListContainersFilters {
  ancestor?: string; // "(<image-name>[:<tag>], <image id>, or <image@digest>)";
  before?: string; // "(<container id> or <container name>)";
  expose?: string; // "(<port>[/<proto>]|<startport-endport>/[<proto>])";
  exited?: string; // "<int> containers with exit code of <int>";
  health?: string; // "(starting|healthy|unhealthy|none)";
  id?: string[]; // "<ID> a container's ID";
  isolation?: string; // "(default|process|hyperv) (Windows daemon only)";
  "is-task"?: string; //"(true|false)";
  label?: string; // "key or label='key=value' of a container label";
  name?: string[]; // "<name> a container's name";
  network?: string; // "(<network id> or <network name>)";
  publish?: string; // "(<port>[/<proto>]|<startport-endport>/[<proto>])";
  since?: string; // "(<container id> or <container name>)";
  status?: string; // "(created|restarting|running|removing|paused|exited|dead)";
  volume?: string; // "(<volume name> or <mount point destination>)";
}

/**
 * Returns the list of containers
 * [NOTE] On a full DAppNode will 14 containers the call takes 17ms on average
 * @returns {array}
 */
async function listContainers(options?: {
  byName?: string;
  byId?: string;
}): Promise<PackageContainer[]> {
  const filters: ListContainersFilters = {};
  if (options) {
    if (options.byName) filters.name = [options.byName];
    if (options.byId) filters.id = [options.byId];
  }
  const containers = await dockerApi.listContainers({
    all: true,
    filters
  });

  /**
   * Format containers
   */
  const dnpList: PackageContainer[] = containers
    .map(container => {
      const packageName = (container.Names[0] || "").replace("/", "");
      const isDnp = packageName.includes(CONTAINER_NAME_PREFIX);
      const isCore = packageName.includes(CONTAINER_CORE_NAME_PREFIX);

      let name;
      if (isDnp) name = packageName.split(CONTAINER_NAME_PREFIX)[1] || "";
      else if (isCore)
        name = packageName.split(CONTAINER_CORE_NAME_PREFIX)[1] || "";
      else name = packageName;

      let version = (container.Image || "").split(":")[1] || "0.0.0";
      // IPFS path
      if ((version || "").startsWith("ipfs-")) {
        version = version.replace("ipfs-", "/ipfs/");
      }

      // Process dappnode.dnp tags
      //   dappnode.dnp.dependencies
      //   dappnode.dnp.origin
      //   dappnode.dnp.chain
      let origin = "";
      let chain = "";
      let dependencies: Dependencies = {};
      const labels = container.Labels;
      if (labels && typeof labels === "object") {
        // Critical for dappGet/aggregate on IPFS DNPs
        if (labels["dappnode.dnp.origin"])
          origin = labels["dappnode.dnp.origin"];
        if (labels["dappnode.dnp.chain"]) chain = labels["dappnode.dnp.chain"];
        if (labels["dappnode.dnp.dependencies"])
          try {
            dependencies = JSON.parse(labels["dappnode.dnp.dependencies"]);
          } catch (e) {}
      }

      const formatedContainer: PackageContainer = {
        id: container.Id,
        packageName,
        version,
        isDnp,
        isCore,
        created: container.Created,
        image: container.Image,
        name: name,
        shortName: shortName(name),
        ports: container.Ports.map(({ PrivatePort, PublicPort, Type }) => ({
          // "PublicPort" will be undefined if the port is not mapped
          ...(PublicPort ? { host: PublicPort } : {}),
          container: PrivatePort,
          protocol: Type === "udp" ? "UDP" : "TCP"
        })),
        volumes: container.Mounts.map(({ Name, Source, Destination }) => ({
          path: Source,
          dest: Destination,
          // "Name" will be undefined if it's not a named volumed
          ...(Name ? { name: Name } : {})
        })),
        state: container.State as ContainerStatus,
        running: container.State === "running",
        dependencies,
        // #### TODO: The ADMIN does not accept an empty chain or origin
        ...(origin ? { origin } : {}),
        ...(chain ? { chain } : {})
      };

      return formatedContainer;
    })
    .filter(pkg => pkg.isDnp || pkg.isCore);

  if (dnpList.length > 1) {
    /**
     * [EXTENDS]
     * Do data manipulation that requires info from other DNPs
     */

    /**
     * Compile volume users
     * @param {object} namedVolumesUsers = {
     *   "nginxproxydnpdappnodeeth_html": [
     *     "letsencrypt-nginx.dnp.dappnode.eth",
     *     "nginx-proxy.dnp.dappnode.eth"
     *   ]
     * }
     * @param {object} namedVolumesOwners = {
     *   "nginxproxydnpdappnodeeth_html": "nginx-proxy.dnp.dappnode.eth"
     * }
     */
    const namedVolumesUsers: {
      [dnpName: string]: string[];
    } = {};
    for (const dnp of dnpList) {
      for (const vol of dnp.volumes || []) {
        if (!vol.name) continue;
        if (!namedVolumesUsers[vol.name])
          namedVolumesUsers[vol.name] = [dnp.name];
        else if (!namedVolumesUsers[vol.name].includes(dnp.name))
          namedVolumesUsers[vol.name].push(dnp.name);
      }
    }
    const namedVolumesOwners: {
      [dnpName: string]: string;
    } = {};
    for (const [volName, users] of Object.entries(namedVolumesUsers)) {
      for (const dnpName of users) {
        // "nginx-proxy.dnp.dappnode.eth" => "nginxproxydnpdappnodeeth"
        if (volName.includes(dnpName.replace(/[^0-9a-z]/gi, "")))
          namedVolumesOwners[volName] = dnpName;
      }
      // Fallback, assign ownership to the first user
      if (!namedVolumesOwners[volName]) namedVolumesOwners[volName] = users[0];
    }

    const dnpListExtended: PackageContainer[] = dnpList.map(dnp => {
      if (!dnp.volumes) return dnp;
      const volumes = dnp.volumes.map(vol => {
        let newVol: VolumeInterface;
        if (vol.name)
          newVol = {
            ...vol,
            users: namedVolumesUsers[vol.name],
            owner: namedVolumesOwners[vol.name],
            isOwner: namedVolumesOwners[vol.name] === dnp.name
          };
        else newVol = vol;
        return newVol;
      });
      return { ...dnp, volumes };
    });

    return dnpListExtended;
  } else {
    /**
     * If data is not extended or if only one container was requested,
     * return the original list
     */
    return dnpList;
  }
}

export default listContainers;
