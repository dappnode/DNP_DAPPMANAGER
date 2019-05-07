const fs = require("fs");
const yaml = require("yamljs");
const validate = require("utils/validate");

/*
 * Reads and parses files. This util is used to abstract some logic
 * out of other files and ease testing.
 */

function parseDockerCompose(dcString) {
  return yaml.parse(dcString);
}

function stringifyDockerCompose(dcObject) {
  return yaml.dump(dcObject, {
    indent: 4
  });
}

// Helper function, read and parse docker-compose
function readDockerCompose(dockerComposePath) {
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`docker-compose does not exist: ${dockerComposePath}`);
  }
  const dcString = fs.readFileSync(dockerComposePath, "utf-8");
  return parseDockerCompose(dcString);
}

function writeDockerCompose(dockerComposePath, dcObject) {
  validate.path(dockerComposePath);
  const dcString = stringifyDockerCompose(dcObject);
  fs.writeFileSync(dockerComposePath, dcString, "utf-8");
}

// Select the first service in a docker-compose
function getUniqueDockerComposeService(dockerComposePath) {
  const dc = readDockerCompose(dockerComposePath);
  const packageName = Object.getOwnPropertyNames(dc.services)[0];
  return dc.services[packageName];
}

// Get the volumes of a docker-compose service
function serviceVolumes(dockerComposePath) {
  const dc = readDockerCompose(dockerComposePath);
  const service = getUniqueDockerComposeService(dockerComposePath);

  const externalVolumes = Object.getOwnPropertyNames(dc.volumes || []);

  let packageVolumes = [];
  const volumes = service.volumes || [];
  volumes.map(volume => {
    if (volume.includes(":")) {
      const volumeName = volume.split(":")[0];
      if (externalVolumes.includes(volumeName)) {
        packageVolumes.push(volumeName);
      }
    }
  });
  return packageVolumes;
}

// Get the container name of a docker-compose service
function containerName(dockerComposePath) {
  const service = getUniqueDockerComposeService(dockerComposePath);
  return service.container_name;
}

// Get an array of ports of a docker-compose service
function dockerComposePorts(dockerComposePath) {
  const service = getUniqueDockerComposeService(dockerComposePath);
  const ports = service.ports || [];
  return ports.map(p => p.split(":")[0]);
}

function envFile(envFileData = "") {
  // Parses key1=value1 files, splited by new line
  //        key2=value2
  return envFileData
    .trim()
    .split("\n")
    .filter(row => row.length > 0)
    .reduce((obj, row) => {
      const [key, value] = row.split(/=(.*)/);
      obj[key] = value;
      return obj;
    }, {});
}

function stringifyEnvs(envs) {
  if (typeof envs === typeof {}) {
    // great
  } else if (typeof envs === typeof "string") {
    throw Error(
      "Attempting to stringify envs of type STRING. Must be an OBJECT: " + envs
    );
  } else {
    throw Error(
      "Attempting to stringify envs of UNKOWN type. Must be an OBJECT: " + envs
    );
  }
  return (
    Object.getOwnPropertyNames(envs)
      // Use join() to prevent "ENV_NAME=undefined"
      .map(envName => [envName, envs[envName] || ""].join("="))
      .join("\n")
      .trim()
  );
}

function packageReq(req) {
  if (!req) throw Error("PARSE ERROR: packageReq is undefined");

  if (typeof req != "string") {
    throw Error("PARSE ERROR: packageReq must be a string, packageReq: " + req);
  }

  // Added for debugging on development
  if (req.length == 1) {
    throw Error(
      `packageReq has only one character, this should not happen, packageReq: ${req}`
    );
  }

  const [name, ver] = req.split("@");

  return {
    name,
    ver: ver || "*",
    req
  };
}

// A package manifest has this format:
// {
//   ...
//   "dependencies": {
//     "nginx-proxy.dnp.dappnode.eth": "latest"
//   }
// }

const manifest = {
  depObject: function(manifest) {
    let depObject = manifest.dependencies || {};
    if (!depObject || typeof depObject != typeof {}) {
      throw Error(
        `Broken dependency object, of: ${JSON.stringify(
          packageReq
        )} depObject: ${depObject}`
      );
    }
    return depObject;
  },

  imageName: manifest => manifest.image.path,
  imageHash: manifest => manifest.image.hash,
  imageSize: manifest => manifest.image.size,
  type: manifest => manifest.type,
  version: manifest => manifest.version
};

module.exports = {
  parseDockerCompose,
  stringifyDockerCompose,
  readDockerCompose,
  writeDockerCompose,
  serviceVolumes,
  containerName,
  dockerComposePorts,
  envFile,
  stringifyEnvs,
  packageReq,
  manifest
};
