// node modules
const logs = require("logs.js")(module);
const { promisify } = require("util");
const docker = require("docker-remote-api");
const request = docker();
const { shortName } = require("utils/strings");

// dedicated modules
const params = require("../params");

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX;
const CONTAINER_CORE_NAME_PREFIX = params.CONTAINER_CORE_NAME_PREFIX;

// ////////////////////////////
// Main functions
//  (Docker API)
//  endpoint documentation https://docs.docker.com/engine/api/v1.24/#31-containers

async function listContainers() {
  const containers = await dockerRequest("get", "/containers/json?all=true");
  return containers.map(format).filter(pkg => pkg.isDnp || pkg.isCore);
}

async function runningPackagesInfo() {
  const containers = await listContainers();
  const containersObject = {};
  containers.forEach(function(container) {
    containersObject[container.name] = container;
  });
  return containersObject;
}

// /////////////////
// Helper functions

function dockerRequest(method, url) {
  const options = { json: true };
  if (method == "post") options.body = null;

  const dockerRequestPromise = promisify(request[method].bind(request));
  return dockerRequestPromise(url, options);
}

// /////////
// utils

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

function format(c) {
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
        logs.warn(`Error parsing ${name} container portsToClose: ${e.stack}`);
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
    created: new Date(1000 * c.Created),
    image: c.Image,
    name: name,
    shortName: shortName(name),
    ports: c.Ports,
    volumes: c.Mounts.map(({ Type, Name, Source, Destination }) => ({
      type: Type,
      name: Name, // Will be null if it's not a named volumed
      path: Source,
      dest: Destination
    })),
    state: c.State,
    running: !/^Exited /i.test(c.Status)
  };
}

module.exports = {
  listContainers,
  runningPackagesInfo
};
