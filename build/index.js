'use strict'
// node modules
const autobahn = require('autobahn')

// dedicated modules
const params = require('./params')
const emitter = require('./modules/emitter')
const dockerCalls = require('./modules/calls/dockerCalls')
const dependenciesTools = require('./modules/tools/dependenciesTools')
const PackageInstaller = require('./modules/PackageInstaller')
const directoryCalls = require('./modules/calls/directoryCalls')
const apm = require('./modules/calls/apm')

const autobahnTag = params.autobahnTag

const autobahnUrl = params.autobahnUrl
const autobahnRealm = params.autobahnRealm
const connection = new autobahn.Connection({ url: autobahnUrl, realm: autobahnRealm })

connection.onopen = function(session, details) {

    console.log("CONNECTED to DAppnode's WAMP "+
      "\n   url "+autobahnUrl+
      "\n   realm: "+autobahnRealm+
      "\n   session ID: "+details.authid)

    register(session, 'installPackage.installer.dnp.dappnode.eth', installPackage)
    register(session, 'removePackage.installer.repo.dappnode.eth', removePackage )
    register(session, 'listPackages.installer.repo.dappnode.eth' , listPackages  )
    register(session, 'listDirectory.installer.repo.dappnode.eth', listDirectory )

    // ###### FOR DEVELOPMENT - simulating an install call
    // ###### FOR DEVELOPMENT - simulating an install call

    setTimeout(function(){
      let link = 'otpweb.dnp.dappnode.eth'
      // session.call('installPackage.installer.dnp.dappnode.eth', [link])
      // session.call('listDirectory.installer.repo.dappnode.eth', [link])
    }, 3000)

    // ^^^^^^ FOR DEVELOPMENT - simulating an install call
    // ^^^^^^ FOR DEVELOPMENT - simulating an install call

    emitter.on('log', (log) => {
      log.topic = log.topic || 'general'
      log.type = log.type || 'default'
      log.msg = String(log.msg) || ''
      console.log('LOG, TOPIC: '+log.topic+' MSG('+log.type+'): '+log.msg)
      session.publish(autobahnTag.installerLog, [log])
    })

}

connection.open()


///////////////////////////////
// Connection helper functions


function register(session, event, handler) {

  const SUCCESS_MESSAGE = '---------------------- \n procedure registered'
  const ERROR_MESSAGE = '------------------------------ \n failed to register procedure '

  return session.register(event, wrapErrors(handler)).then(
    function (reg) { console.log(SUCCESS_MESSAGE) },
    function (err) { console.log(ERROR_MESSAGE, err) }
  )
}


function wrapErrors(handler) {

  return async function () {
    try {
        return await handler(arguments[0])
    } catch (err) {

      console.log(err)
      return JSON.stringify({
          success: false,
          message: err.message
      })

    }
  }
}


///////////////////////////////
// Main functions


async function installPackage(req) {

  let packageReq = parsePackageReq(req[0])

  // If requested package is already running, throw error
  if (await packageIsAlreadyRunning(packageReq.name)) {
    return JSON.stringify({
        success: false,
        message: "Package already running"
    })
  }

  // Get complete list of packages = requested + dependencies
  let packagesToInstall = await dependenciesTools.getAllResolved(packageReq.req)
  packagesToInstall.forEach((dep) => {
    emitter.emit('log', {
      topic: dep,
      msg: "is a dependency"
    })
  })
  packagesToInstall.push(packageReq.req)
  console.log('##### OG INStALL LIST')
  console.log(packagesToInstall)

  // Check that there are no incompatibilities between packages
  let packageIncompatibilities = await getPackageIncompatibilities(packagesToInstall)
  if (packageIncompatibilities) {
    return JSON.stringify({
        success: false,
        message: "Packages have incompatibilities: " + JSON.stringify(packageIncompatibilities)
    })
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


async function removePackage(req) {

    let id = req[0]
    let containers = await dockerCalls.listContainers()
    let container = containers.find( container => container.id == id );

    if (container) {

      console.log('Removing package: '+container.name+' is status: '+container.state)
      await dockerCalls.deleteContainer(container.id)

      return JSON.stringify({
          success: true,
          message: 'Removed package: '+container.name+' is status: '+container.state
      })

    } else {

      return JSON.stringify({
          success: true,
          message: 'No package found with ID: '+id
      })
    }
}


async function listPackages(req) {

    let dnpList = await dockerCalls.listContainers()
    // Return
    return JSON.stringify({
        success: true,
        message: "Listing " + dnpList.length + " packages",
        result: dnpList
    })

}


async function listDirectory(req) {

    let packagesWithVersions = await getPackagesWithVersions()

    return JSON.stringify({
        success: true,
        message: "Listing " + packagesWithVersions.length + " packages",
        result: packagesWithVersions
    })

}

async function getPackagesWithVersions() {

  let packages = await directoryCalls.getDirectory()

  return await Promise.all(packages.map(async function(_package) {
    _package.versions = await apm.getRepoVersions(_package.name)
    _package.versions.reverse()
    return _package
  }))

}


///////////////////////////////
// Helper functions


function parsePackageReq(req) {

  let packageName = req.split('@')[0]
  let version = req.split('@')[1] || 'latest'

  return {
    name: packageName,
    ver: version,
    req: packageName + '@' + version
  }
}

async function packageIsAlreadyRunning(packageName) {

  let runningPackages = await dockerCalls.runningPackagesInfo()
  return (packageName in runningPackages)

}


function getPackageIncompatibilities(packagesToInstall) {

  // TODO
  // - Verify port collision
  // - Existance of volumes

}
