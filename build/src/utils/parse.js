// node modules
const fs = require('fs');
const yaml = require('yamljs');

// Helper function, read and parse docker-compose
function readDockerCompose(DOCKERCOMPOSE_PATH) {
  if (!fs.existsSync(DOCKERCOMPOSE_PATH)) {
    throw Error('docker-compose does not exist: '+DOCKERCOMPOSE_PATH);
  }
  const dcString = fs.readFileSync(DOCKERCOMPOSE_PATH, 'utf-8');
  return yaml.parse(dcString);
}

// Select the first service in a docker-compose
function getUniqueDockerComposeService(DOCKERCOMPOSE_PATH) {
  const dc = readDockerCompose(DOCKERCOMPOSE_PATH);
  const packageName = Object.getOwnPropertyNames(dc.services)[0];
  return dc.services[packageName];
}

// Get the volumes of a docker-compose service
function serviceVolumes(DOCKERCOMPOSE_PATH) {
  const dc = readDockerCompose(DOCKERCOMPOSE_PATH);
  const service = getUniqueDockerComposeService(DOCKERCOMPOSE_PATH);

  const externalVolumes = Object.getOwnPropertyNames(dc.volumes || []);

  let packageVolumes = [];
  const volumes = service.volumes || [];
  volumes.map((volume) => {
    if (volume.includes(':')) {
      const volumeName = volume.split(':')[0];
      if (externalVolumes.includes(volumeName)) {
        packageVolumes.push(volumeName);
      }
    }
  });
  return packageVolumes;
}

// Get the container name of a docker-compose service
function containerName(DOCKERCOMPOSE_PATH) {
  const service = getUniqueDockerComposeService(DOCKERCOMPOSE_PATH);
  return service.container_name;
}

// Get an array of ports of a docker-compose service
function dockerComposePorts(DOCKERCOMPOSE_PATH) {
  const service = getUniqueDockerComposeService(DOCKERCOMPOSE_PATH);
  const ports = service.ports || [];
  return ports.map((p) => p.split(':')[0]);
}

function envFile(envFileData) {
  let res = {};
  // Parses key1=value1 files, splited by new line
  //        key2=value2
  envFileData
    .trim()
    .split('\n')
    .filter((row) => row.length > 0 )
    .map((row) => {
      res[row.split('=')[0]] = row.split('=')[1];
    });

  return res;
}

function stringifyEnvs(envs) {
  return Object.getOwnPropertyNames(envs)
    .map((envName) => {
      let envValue = envs[envName];
      return envName + '=' + envValue;
    })
    .join('\n').trim();
}


function packageReq(req) {
  if (!req) throw Error('PARSE ERROR: packageReq is undefined');

  if (typeof(req) != 'string') {
    throw Error('PARSE ERROR: packageReq must be a string, packageReq: ' + req);
  }

  // Added for debugging on development
  if (req.length == 1) {
    throw Error('WARNING: packageReq has only one character, this should not happen, '
      + 'packageReq: ' + req);
  }

  let name = req.split('@')[0];
  let ver = req.split('@')[1] || 'latest';

  return {
    name,
    ver,
    req: name + '@' + ver,
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
    if ( !depObject || typeof(depObject) != typeof({}) ) {
      throw Error('BROKEN DEPENDENCY OBJECT, of package: '
        + JSON.stringify(packageReq)+' depObject: '+depObject);
    }
    return depObject;
  },

  imageName: (manifest) => manifest.image.path,
  imageHash: (manifest) => manifest.image.hash,
  imageSize: (manifest) => manifest.image.size,
  type: (manifest) => manifest.type,
  version: (manifest) => manifest.version,
};


module.exports = {
  serviceVolumes,
  containerName,
  dockerComposePorts,
  envFile,
  stringifyEnvs,
  packageReq,
  manifest,
};
