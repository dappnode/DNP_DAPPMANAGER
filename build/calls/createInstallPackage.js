
const dockerCalls = require('../modules/calls/dockerCalls')
const dependenciesTools = require('../modules/tools/dependenciesTools')
const PackageInstaller = require('../modules/PackageInstaller')
const emitter = require('../modules/emitter')
const fs = require('fs')
const getPath = require('../utils/getPath')

const { stringifyEnvs } = require('../utils/parse')

const params = require('../params')
const REPO_DIR = params.REPO_DIR
const ENV_FILE_EXTENSION = params.ENV_FILE_EXTENSION


function createInstallPackage(params) {

  return async function installPackage(req) {

    let packageReq = utils.parsePackageReq(req[0])
    let envs = JSON.parse(req[1])

    // If requested package is already running, throw error
    if (await packageIsAlreadyRunning(packageReq.name)) {
      throw Error("Package already running")
    }

    // Write envs, this will fail at this point (REPO_DIR not created yet)
    await fs.writeFileSync(
      getPath.ENV_FILE(PACKAGE_NAME, params),
      stringifyEnvs(envs))

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




module.exports = createInstallPackage
