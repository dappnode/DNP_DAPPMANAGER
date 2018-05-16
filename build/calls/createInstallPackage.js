
const emitter = require('../modules/emitter')
const fs = require('fs')

// Utilities
const pkg = require('../utils/packages')
const { stringifyEnvs } = require('../utils/parse')
const getPath = require('../utils/getPath')
const dependencies = require('../utils/dependencies')
const parse = require('../utils/parse')
const params = require('../params')


function createInstallPackage(getAllDependenciesResolvedOrdered,
  downloadPackages,
  runPackages) {

  return async function installPackage(req) {

    let packageReq = parse.packageReq(req[0])

    // Returns a list of unique dep (highest requested version) + requested package
    // > getManifest needs IPFS
    // > Returns an order to follow in order to install repecting dependencies
    let packageList = await getAllDependenciesResolvedOrdered(packageReq)

    // -> install in paralel
    await downloadPackages(packageList)
    // -> run in serie
    await runPackages(packageList)

    return JSON.stringify({
        success: true,
        message: 'Installed ' + packageReq.name + ' version: ' + packageReq.ver
    })
  }
}


///////////////////////////////
// Helper functions


function getPackageIncompatibilities(packagesToInstall) {

  // TODO
  // - Verify port collision
  // - Existance of volumes

}




module.exports = createInstallPackage
