// node modules
const { promisify } = require('util');
const shell = require('shelljs')
const fs = require('fs')
const docker = require('docker-remote-api')
const request = docker()

// dedicated modules
const params = require('../params')

const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX

//////////////////////////////
// Main functions
//  (Docker API)
//  endpoint documentation https://docs.docker.com/engine/api/v1.24/#31-containers

async function listContainers() {
  let containers = await dockerRequest('get', '/containers/json?all=true')
  return containers
    .map(format)
    .filter(container => container.isDNP)
}


async function runningPackagesInfo() {

  let containers = await listContainers()
  let containersObject = {}
  containers.forEach(function(container) {
    containersObject[container.name] = container
  })
  return containersObject

}





///////////////////
// Helper functions


function dockerRequest(method, url) {

  options = { json: true }
  if (method == 'post') options.body = null

  const dockerRequestPromise = promisify(request[method].bind(request))
  return dockerRequestPromise(url, options)

}


///////////
// utils


function format(c) {
  let packageName = c.Names[0]
  let isDNP = packageName.includes(CONTAINER_NAME_PREFIX)
  let name = c.Names[0].split(CONTAINER_NAME_PREFIX)[1]

  let shortName;
  if (name && name.includes('.')) shortName = name.split('.')[0]
  else shortName = name

  return {
    id: c.Id,
    isDNP: isDNP,
    created: new Date(1000*c.Created),
    image: c.Image,
    name: name,
    shortName: shortName,
    version: c.Labels[params.DNP_VERSION_TAG],
    ports: mapPorts(c.Ports),
    state: c.State,
    running: !/^Exited /i.test(c.Status)
  }
}


function mapPorts(ports) {
  if (!ports || ports.length === 0) return ''
  var res = []
  ports.forEach(function(p) {
    let publicPort = p.PublicPort || ''
    let privatePort = p.PrivatePort || ''
    res.push(publicPort+'->'+privatePort)
  })
  return res.join(', ')
}


module.exports = {
  listContainers,
  runningPackagesInfo
}
