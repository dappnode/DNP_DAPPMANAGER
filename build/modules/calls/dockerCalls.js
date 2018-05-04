// node modules
const shell = require('shelljs')
const fs = require('fs')
const docker = require('docker-remote-api')
const request = docker()

// dedicated modules
const params = require('../../params')

const TMP_REPO_DIR = params.TMP_REPO_DIR
const DAPPNODE_PACKAGE_NAME = params.DAPPNODE_PACKAGE_NAME
const CONTAINER_NAME_PREFIX = params.CONTAINER_NAME_PREFIX

// Documentation of docker-remote-api possible calls
// https://docs.docker.com/engine/api/v1.24/#31-containers

async function listPackages() {
    let installedDNP = await getListOfInstalledDNP()
    let runningDNP = await runningPackagesInfo()

    let dnpList = installedDNP.map(dnp => {
      dnp.running = dnp.name in runningDNP
      dnp.id = dnp.name
      if (dnp.running) dnp.ports = runningDNP[dnp.name].ports
      return dnp
    })

    return dnpList;
}

function runningPackagesInfo() {
  return new Promise(function(resolve, reject) {
    request.get('/containers/json', { json:true }, function(err, containers) {
      if (err) console.log(err)
      let containersObject = {}
      containers
        .map(format)
        .filter(container => container.isDNP)
        .forEach(function(container) {
          containersObject[container.name] = container
        })
      resolve(containersObject)
    })
  })
}

function deleteContainer(id) {
  return new Promise(function(resolve, reject) {
    request.delete('/containers/'+id+'?force=true', { json:true }, function(err, res) {
      if (err) console.log(err)
      console.log('###### DELETE POST RES')
      console.log(res)
      resolve()
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


// containers.map(format)
function format(c) {
    let packageName = c.Names[0]
    let isDNP = packageName.includes(CONTAINER_NAME_PREFIX)
    let name = c.Names[0].split(CONTAINER_NAME_PREFIX)[1]
    return {
      id: c.Id,
      isDNP: isDNP,
      created: new Date(1000*c.Created),
      image: c.Image,
      name: name,
      ports: mapPorts(c.Ports),
      status: c.Status,
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


function loadImage(imagePath) {

  return new Promise(function(resolve, reject) {

    let command = 'docker load -i ' + imagePath

    shell.exec(command, { silent: true }, function(code, stdout, stderr) {
      if (code !== 0) {
        return Error(stderr)
      } else {
        return resolve(stdout)
      }
    })

  })
}


function dockerComposeUp(dockerComposePath) {

  return new Promise(function(resolve, reject) {

    let command = 'docker-compose -f ' + dockerComposePath + ' up -d'

    shell.exec(command, { silent: true }, function(code, stdout, stderr) {
      if (code !== 0) {
        return Error(stderr)
      } else {
        return resolve(stdout)
      }
    })

  })
}


module.exports = {
  listPackages,
  runningPackagesInfo,
  deleteContainer,
  loadImage,
  dockerComposeUp
}
