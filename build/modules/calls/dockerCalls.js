// node modules
const { promisify } = require('util');
const shell = require('shelljs')
const fs = require('fs')
const docker = require('docker-remote-api')
const request = docker()

// dedicated modules
const params = require('../../params')

const TMP_REPO_DIR = params.TMP_REPO_DIR
const DAPPNODE_PACKAGE_NAME = params.DAPPNODE_PACKAGE_NAME
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

//  (Shell API) - for methods not supported in the docker API

function loadImage(imagePath) {
  return shellExec('docker load -i ' + imagePath)
}


// FOR TESTING
// var docker = new DockerManager()
// docker.setExec(myfakeexec)
//
// docker.up()


class Docker_compose {
  constructor() {
    this.exec = shellExec
  }

  setExec(exec) {
    this.exec = exec
  }

  // Usage: up [options] [--scale SERVICE=NUM...] [SERVICE...]
  // Options:
  // -d, --detach               Detached mode: Run containers in the background, print new container names.
  // --no-color                 Produce monochrome output.
  // --no-deps                  Don't start linked services.
  // --force-recreate           Recreate containers even if their configuration and image haven't changed.
  // --always-recreate-deps     Recreate dependent containers. Incompatible with --no-recreate.
  // --no-recreate              If containers already exist, don't recreate them. Incompatible with --force-recreate and -V.
  // --no-build                 Don't build an image, even if it's missing.
  // --no-start                 Don't start the services after creating them.
  // --build                    Build images before starting containers.
  // --exit-code-from SERVICE   Return the exit code of the selected service
  //                            container. Implies --abort-on-container-exit.

  up(dockerComposePath) {
    return this.exec('docker-compose -f ' + dockerComposePath + ' up -d')
  }

  // Usage: down [options]
  // Options:
  //     --rmi type              Remove images. Type must be one of:
  //                               'all': Remove all images used by any service.
  //                               'local': Remove only images that don't have a custom tag set by the `image` field.
  //     -v, --volumes           Remove named volumes declared in the `volumes`
  //     --remove-orphans        Remove containers for services not defined in the Compose file
  //     -t, --timeout TIMEOUT   Specify a shutdown timeout in seconds. (default: 10)
  down(dockerComposePath, options={}) {
    let optionsString = parseOptions(options)
    return this.exec('docker-compose -f ' + dockerComposePath + ' down'+optionsString)
  }

  // Usage: start [SERVICE...]
  start(dockerComposePath) {
    return this.exec('docker-compose -f ' + dockerComposePath + ' start')
  }

  // Usage: stop [options] [SERVICE...]
  // Options:
  // -t, --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  stop(dockerComposePath, options={}) {
    let optionsString = parseOptions(options)
    return this.exec('docker-compose -f ' + dockerComposePath + ' stop'+optionsString)
  }

  // Usage: logs [options] [SERVICE...]
  // Options:
  // --no-color          Produce monochrome output.
  // -f, --follow        Follow log output
  // -t, --timestamps    Show timestamps
  // --tail="all"        Number of lines to show from the end of the logs
  //                     for each container.
  logs(dockerComposePath, options={}) {
    let optionsString = parseOptions(options)
    return this.exec('docker-compose -f ' + dockerComposePath + ' logs'+optionsString)
  }

  // Usage: ps [options] [SERVICE...]
  // Options:
  // -q    Only display IDs
  ps(dockerComposePath) {
    return this.exec('docker-compose -f ' + dockerComposePath + ' ps')
  }

}


function parseOptions(options) {
  let optionsString = ''

  // --timeout TIMEOUT      Specify a shutdown timeout in seconds (default: 10).
  if (Number.isInteger(options.timeout)) optionsString += ' --timeout '+options.timeout
  // -t, --timestamps    Show timestamps
  if (options.timestamps) optionsString += ' --timestamps'

  return optionsString
}


function dockerComposeUp(dockerComposePath) {
  return shellExec('docker-compose -f ' + dockerComposePath + ' up -d')
}



///////////////////
// Helper functions


function dockerRequest(method, url) {

  options = { json: true }
  if (method == 'post') options.body = null

  const dockerRequestPromise = promisify(request[method].bind(request))
  return dockerRequestPromise(url, options)

}


function shellExec(command) {

  return new Promise(function(resolve, reject) {
    shell.exec(command, { silent: true }, function(code, stdout, stderr) {
      if (code !== 0) {
        return reject(Error(stderr))
      } else {
        return resolve(stdout)
      }
    })

  })
}


function getListOfInstalledDNP() {
  return new Promise(function(resolve, reject) {
    let installedDNP = [];
    shell.ls(TMP_REPO_DIR).forEach(function (file) {
      let dnpManifestPath = TMP_REPO_DIR + file + '/' + DAPPNODE_PACKAGE_NAME;
      if (fs.existsSync(dnpManifestPath)) {
        let dnpManifest = JSON.parse(shell.cat(dnpManifestPath).stdout)
        installedDNP.push({
          name: dnpManifest.name,
          version: dnpManifest.version,
          description: dnpManifest.description
        })
      }
    });
    resolve(installedDNP)
  })
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
  runningPackagesInfo,
  loadImage,
  Docker_compose
}
