// node modules
const logs = require("logs.js")(module);
const { shortName, stringIncludes } = require("utils/strings");
const dockerRequest = require("modules/dockerRequest");
// dedicated modules
const params = require("../params");

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;

// ////////////////////////////
// Main functions
//  (Docker API)
//  endpoint documentation https://docs.docker.com/engine/api/v1.24/#31-containers

// Sample response:
// curl --unix-socket /var/run/docker.sock http:/v1.24/containers/json?all=1 | python -m json.tool
//
// {
//   "Command": "supervisord -c /supervisord.conf",
//   "Created": 1558258481,
//   "HostConfig": {
//       "NetworkMode": "dncore_network"
//   },
//   "Id": "94bde8655e2d8daca033486ef46e7d270c4f4b6f6c18b820d80c2cbf211130bd",
//   "Image": "ln.dnp.dappnode.eth:0.1.1",
//   "ImageID": "sha256:41214dd9be6c51b33b6872f174151c69f83409d33a9eaa7ee78032faa1b03c69",
//   "Labels": {
//       "com.docker.compose.config-hash": "a458dcb93640f82123abf4e5beccb7dcb1773f6ef58af65b322581da551491b1",
//       "com.docker.compose.container-number": "1",
//       "com.docker.compose.oneoff": "False",
//       "com.docker.compose.project": "lndnpdappnodeeth",
//       "com.docker.compose.service": "ln.dnp.dappnode.eth",
//       "com.docker.compose.version": "1.20.1",
//       "dappnode.dnp.dependencies": "{\"bitcoin.dnp.dappnode.eth\":\"latest\"}"
//   },
//   "Mounts": [
//       {
//           "Destination": "/root/.lnd",
//           "Driver": "local",
//           "Mode": "rw",
//           "Name": "lndnpdappnodeeth_lndconfig_data",
//           "Propagation": "",
//           "RW": true,
//           "Source": "/var/lib/docker/volumes/lndnpdappnodeeth_lndconfig_data/_data",
//           "Type": "volume"
//       }
//   ],
//   "Names": [
//       "/DAppNodePackage-ln.dnp.dappnode.eth"
//   ],
//   "NetworkSettings": {
//       "Networks": {
//           "dncore_network": {
//               "Aliases": null,
//               "DriverOpts": null,
//               "EndpointID": "f6bdd575b22ce0df36bdb408ea9c1f3ae291ab398f5aecc79f63ffd8e6f3fe41",
//               "Gateway": "172.33.0.1",
//               "GlobalIPv6Address": "",
//               "GlobalIPv6PrefixLen": 0,
//               "IPAMConfig": null,
//               "IPAddress": "172.33.0.2",
//               "IPPrefixLen": 16,
//               "IPv6Gateway": "",
//               "Links": null,
//               "MacAddress": "02:42:ac:21:00:02",
//               "NetworkID": "71794cdb4278aafb8339d8200a56a971e36e350eb67aa90b7443b52b831c1f25"
//           }
//       }
//   },
//   "Ports": [
//       {
//           "PrivatePort": 10009,
//           "Type": "tcp"
//       },
//       {
//           "PrivatePort": 80,
//           "Type": "tcp"
//       },
//       {
//           "IP": "0.0.0.0",
//           "PrivatePort": 9735,
//           "PublicPort": 9735,
//           "Type": "tcp"
//       }
//   ],
//   "State": "running",
//   "Status": "Up 3 weeks"
// },

/**
 * @returns {array} dnpList = [{
 *   id: c.Id,
 *   packageName,
 *   version: "0.1.0",
 *   ...fromLabels,
 *   isDnp: true,
 *   isCore: false,
 *   created: c.Created,
 *   image: "ln.dnp.dappnode.eth:0.1.0",
 *   name: "ln.dnp.dappnode.eth",
 *   shortName: "ln",
 *   ports: c.Ports,
 *   volumes: [{
 *     type: "volume",
 *     name: "lndnpdappnodeeth_lndconfig_data",
 *     path: "/var/lib/docker/volumes/lndnpdappnodeeth_lndconfig_data/_data",
 *     dest: "/root/.lnd",
 *     users: ["ln.dnp.dappnode.eth"],
 *     owner: "ln.dnp.dappnode.eth",
 *     isOwner: true
 *   }, ... ],
 *   state: "running",
 *   running: true
 * }, ... ]
 */
async function listContainers() {
  const containers = await dockerRequest("get", "/containers/json?all=true");
  const dnpList = containers
    .map(c => {
      const packageName = (c.Names[0] || "").replace("/", "");
      const isDnp = packageName.includes(CONTAINER_NAME_PREFIX);
      const isCore = packageName.includes(CONTAINER_CORE_NAME_PREFIX);

      let name;
      if (isDnp) name = packageName.split(CONTAINER_NAME_PREFIX)[1] || "";
      else if (isCore)
        name = packageName.split(CONTAINER_CORE_NAME_PREFIX)[1] || "";
      else name = packageName;

      let version = (c.Image || "").split(":")[1] || "0.0.0";
      // IPFS path
      if ((version || "").startsWith("ipfs-")) {
        version = version.replace("ipfs-", "/ipfs/");
      }

      // Process dappnode.dnp tags
      //   dappnode.dnp.dependencies
      //   dappnode.dnp.origin
      //   dappnode.dnp.chain
      const fromLabels = {};
      if (c.Labels && typeof c.Labels === "object") {
        if (c.Labels["dappnode.dnp.origin"]) {
          // Critical for dappGet/aggregate on IPFS DNPs
          fromLabels.origin = c.Labels["dappnode.dnp.origin"];
        }

        if (c.Labels["dappnode.dnp.chain"]) {
          fromLabels.chain = c.Labels["dappnode.dnp.chain"];
        }

        if (c.Labels["dappnode.dnp.dependencies"]) {
          try {
            fromLabels.dependencies = JSON.parse(
              c.Labels["dappnode.dnp.dependencies"]
            );
          } catch (e) {
            logs.warn(
              `Error parsing ${name} container dependencies label "${
                c.Labels["dappnode.dnp.dependencies"]
              }": ${e.stack}`
            );
          }
        }

        if (c.Labels["portsToClose"]) {
          try {
            fromLabels.portsToClose = JSON.parse(c.Labels.portsToClose);
          } catch (e) {
            logs.warn(
              `Error parsing ${name} container portsToClose: ${e.stack}`
            );
            fromLabels.portsToClose = [];
          }
        } else {
          fromLabels.portsToClose = [];
        }
      }

      return {
        id: c.Id,
        packageName,
        version,
        ...fromLabels,
        isDnp,
        isCore,
        created: c.Created,
        image: c.Image,
        name: name,
        shortName: shortName(name),
        ports: c.Ports.map(({ IP, PrivatePort, PublicPort, Type }) => ({
          host: PublicPort || null,
          container: PrivatePort || null,
          protocol: Type === "udp" ? "UDP" : "TCP",
          ephemeral: Boolean(PublicPort && PublicPort >= 32768),
          ip: IP || "0.0.0.0"
        })),
        volumes: c.Mounts.map(({ Type, Name, Source, Destination }) => ({
          type: Type,
          path: Source,
          dest: Destination,
          // "Name" will be null if it's not a named volumed
          ...(Name ? { name: Name } : {})
        })),
        state: c.State,
        running: !/^Exited /i.test(c.Status)
      };
    })
    .filter(pkg => pkg.isDnp || pkg.isCore);

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
  const namedVolumesUsers = {};
  for (const dnp of dnpList) {
    for (const vol of dnp.volumes || []) {
      if (!vol.name) continue;
      if (!namedVolumesUsers[vol.name])
        namedVolumesUsers[vol.name] = [dnp.name];
      else if (!namedVolumesUsers[vol.name].includes(dnp.name))
        namedVolumesUsers[vol.name].push(dnp.name);
    }
  }
  const namedVolumesOwners = {};
  for (const [volName, users] of Object.entries(namedVolumesUsers)) {
    for (const dnpName of users) {
      // "nginx-proxy.dnp.dappnode.eth" => "nginxproxydnpdappnodeeth"
      if (stringIncludes(volName, dnpName.replace(/[^0-9a-z]/gi, "")))
        namedVolumesOwners[volName] = dnpName;
    }
    // Fallback, assign ownership to the first user
    if (!namedVolumesOwners[volName]) namedVolumesOwners[volName] = users[0];
  }

  const dnpListExtended = dnpList.map(dnp => {
    if (!dnp.volumes) return dnp;
    const volumes = dnp.volumes.map(vol => {
      if (!vol.name) return vol;
      return {
        ...vol,
        users: namedVolumesUsers[vol.name],
        owner: namedVolumesOwners[vol.name],
        isOwner: namedVolumesOwners[vol.name] === dnp.name
      };
    });
    return { ...dnp, volumes };
  });

  return dnpListExtended;
}

async function getContainer(id) {
  const dnpList = await listContainers();
  return dnpList.find(
    dnp => (dnp.name || "").includes(id) || (dnp.id || "").includes(id)
  );
}

module.exports = {
  listContainers,
  getContainer
};
