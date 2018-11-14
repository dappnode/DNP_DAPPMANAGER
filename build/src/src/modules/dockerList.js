// node modules
const {promisify} = require('util');
const docker = require('docker-remote-api');
const request = docker();

// dedicated modules
const params = require('../params');

const DNP_CONTAINER_NAME_PREFIX = params.DNP_CONTAINER_NAME_PREFIX;
const CORE_CONTAINER_NAME_PREFIX = params.CORE_CONTAINER_NAME_PREFIX;

// ////////////////////////////
// Main functions
//  (Docker API)
//  endpoint documentation https://docs.docker.com/engine/api/v1.24/#31-containers

async function listContainers() {
  let containers = await dockerRequest('get', '/containers/json?all=true');
  return containers
    .map(format)
    .filter((pkg) => pkg.isDNP || pkg.isCORE);
}

async function runningPackagesInfo() {
  let containers = await listContainers();
  let containersObject = {};
  containers.forEach(function(container) {
    containersObject[container.name] = container;
  });
  return containersObject;
}


// /////////////////
// Helper functions


function dockerRequest(method, url) {
  const options = {json: true};
  if (method == 'post') options.body = null;

  const dockerRequestPromise = promisify(request[method].bind(request));
  return dockerRequestPromise(url, options);
}


// /////////
// utils


function format(c) {
  let packageName = c.Names[0].replace('/', '');
  let isDNP = packageName.includes(DNP_CONTAINER_NAME_PREFIX);
  let isCORE = packageName.includes(CORE_CONTAINER_NAME_PREFIX);

  let name;
  if (isDNP) name = packageName.split(DNP_CONTAINER_NAME_PREFIX)[1];
  else if (isCORE) name = packageName.split(CORE_CONTAINER_NAME_PREFIX)[1];
  else name = packageName;

  let shortName;
  if (name && name.includes('.')) shortName = name.split('.')[0];
  else shortName = name;

  let version = c.Image.split(':')[1] || '0.0.0';
  // IPFS path
  if (version && version.startsWith('ipfs-')) {
    version = version.replace('ipfs-', '/ipfs/');
  }

  return {
    id: c.Id,
    version,
    origin: c.Labels.origin,
    isDNP,
    isCORE,
    created: new Date(1000*c.Created),
    image: c.Image,
    name: name,
    shortName: shortName,
    ports: mapPorts(c.Ports),
    volumes: c.Mounts.map(({Name, Source}) => ({name: Name, path: Source})),
    state: c.State,
    running: !/^Exited /i.test(c.Status),
  };
}


function mapPorts(ports) {
  if (!ports || ports.length === 0) return '';
  let res = [];
  ports.forEach(function(p) {
    let publicPort = p.PublicPort || '';
    let privatePort = p.PrivatePort || '';
    res.push(publicPort+'->'+privatePort);
  });
  return res.join(', ');
}


module.exports = {
  listContainers,
  runningPackagesInfo,
};
