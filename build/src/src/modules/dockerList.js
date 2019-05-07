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
    volumes: c.Mounts.map(({ Type, Name, Source }) => ({
      type: Type,
      name: Name,
      path: Source
    })),
    state: c.State,
    running: !/^Exited /i.test(c.Status)
  };
}

module.exports = {
  listContainers,
  runningPackagesInfo
};
