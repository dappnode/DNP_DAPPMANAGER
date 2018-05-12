const utils = require('../utils')
const dockerCalls = require('../modules/calls/dockerCalls')
const dependenciesTools = require('../modules/tools/dependenciesTools')
const PackageInstaller = require('../modules/PackageInstaller')
const emitter = require('../modules/emitter')
const fs = require('fs')

const params = require('../params')
const REPO_DIR = params.REPO_DIR
const ENV_FILE_EXTENSION = params.ENV_FILE_EXTENSION

async function installPackage(req) {

  let packageReq = utils.parsePackageReq(req[0])
  let envs = JSON.parse(req[1])

  // If requested package is already running, throw error
  if (await packageIsAlreadyRunning(packageReq.name)) {
    throw Error("Package already running")
  }

  // Write envs
  await writeEnvs(packageReq.name, envs)

  // Get complete list of packages = requested + dependencies
  let packagesToInstall = await dependenciesTools.getAllResolved(packageReq.req)
  packagesToInstall.forEach((dep) => {
    emitter.emit('log', {
      topic: dep,
      msg: "is a dependency"
    })
  })
  packagesToInstall.push(packageReq.req)
  console.log('##### OG INSTALL LIST')
  console.log(packagesToInstall)

  // Check that there are no incompatibilities between packages
  let packageIncompatibilities = await getPackageIncompatibilities(packagesToInstall)
  if (packageIncompatibilities) {
    throw Error( "Packages have incompatibilities: " + JSON.stringify(packageIncompatibilities) )
  }

  let packageInstallerPromiseArray = packagesToInstall.map(dep => {
    let packageInstaller = new PackageInstaller(dep)
    return packageInstaller.launch()
  })
  return await Promise.all(packageInstallerPromiseArray).then(packageList => {
    return JSON.stringify({
        success: true,
        message: 'Completed the installation of ' + packageReq.req
    })
  })

}


///////////////////////////////
// Helper functions


async function packageIsAlreadyRunning(packageName) {

  let runningPackages = await dockerCalls.runningPackagesInfo()
  return (packageName in runningPackages)

}

function getPackageIncompatibilities(packagesToInstall) {

  // TODO
  // - Verify port collision
  // - Existance of volumes

}


async function writeEnvs(packageName, envs) {

  const ENV_FILE_PATH = REPO_DIR + packageName + '/' + packageName + ENV_FILE_EXTENSION

  let envNames = Object.getOwnPropertyNames(envs)
  let envFileData = envNames
    .map((envName) => {
      let envValue = envs[envName]
      return envName + '=' + envValue
    })
    .join('\n')

  await writeFile(envFileData, ENV_FILE_PATH)

}


function writeFile(data, path) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, data, 'utf-8', function(err) {
            if (err) {
                return reject(err)
            }
            return resolve()
        })
    })
}


module.exports = installPackage
