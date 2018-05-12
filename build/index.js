'use strict'
// node modules
const autobahn = require('autobahn')
const fs = require('fs')

// dedicated modules
const params = require('./params')
const emitter = require('./modules/emitter')
const dockerCalls = require('./modules/calls/dockerCalls')
const { Docker_Compose } = require('./modules/calls/dockerCalls')
const dependenciesTools = require('./modules/tools/dependenciesTools')
const PackageInstaller = require('./modules/PackageInstaller')
const directoryCalls = require('./modules/calls/directoryCalls')
const getManifest = require('./modules/getManifest')
const apm = require('./modules/calls/apm')

const docker_compose = new Docker_Compose()

// Define paths
const REPO_DIR = params.REPO_DIR
const DAPPNODE_PACKAGE_NAME = params.DAPPNODE_PACKAGE_NAME
const DOCKERCOMPOSE_NAME = params.DOCKERCOMPOSE_NAME

const autobahnTag = params.autobahnTag
const autobahnUrl = params.autobahnUrl
const autobahnRealm = params.autobahnRealm
const connection = new autobahn.Connection({ url: autobahnUrl, realm: autobahnRealm })

connection.onopen = function(session, details) {

    console.log("CONNECTED to DAppnode's WAMP "+
      "\n   url "+autobahnUrl+
      "\n   realm: "+autobahnRealm+
      "\n   session ID: "+details.authid)

    register(session, 'installPackage.installer.dnp.dappnode.eth',   installPackage)
    register(session, 'removePackage.installer.dnp.dappnode.eth',    removePackage)
    register(session, 'togglePackage.installer.dnp.dappnode.eth',    togglePackage)
    register(session, 'logPackage.installer.dnp.dappnode.eth',       logPackage)
    register(session, 'listPackages.installer.repo.dappnode.eth' ,   listPackages)
    register(session, 'listDirectory.installer.repo.dappnode.eth',   listDirectory)
    register(session, 'fetchPackageInfo.installer.dnp.dappnode.eth', fetchPackageInfo)


    // ###### FOR DEVELOPMENT - simulating an install call
    // ###### FOR DEVELOPMENT - simulating an install call

    setTimeout(function(){
      let link = 'otpweb.dnp.dappnode.eth'
      session.call('fetchPackageInfo.installer.dnp.dappnode.eth', [link])
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

async function writeEnvs(packageReq, envs) {
  let dnpManifest = await getManifest(packageReq.req)
  let path = getPaths (dnpManifest)
  let PACKAGE_REPO_DIR = REPO_DIR + dnpManifest.name
}


async function installPackage(req) {

  let packageReq = parsePackageReq(req[0])
  let envs = JSON.parse(req[1])

  // If requested package is already running, throw error
  if (await packageIsAlreadyRunning(packageReq.name)) {
    return JSON.stringify({
        success: false,
        message: "Package already running"
    })
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

    let packageName = req[0]
    let dockerComposePath = REPO_DIR + packageName + '/' + DOCKERCOMPOSE_NAME
    if (!fs.existsSync(dockerComposePath)) {
      return JSON.stringify({
          success: false,
          message: 'No docker-compose found with at: ' + dockerComposePath
      })
    }

    console.log('Removing package: ' + packageName)
    await docker_compose.down(dockerComposePath)

    return JSON.stringify({
        success: true,
        message: 'Removed package: ' + packageName
    })
}


async function togglePackage(req) {

    let packageName = req[0]
    let dockerComposePath = REPO_DIR + packageName + '/' + DOCKERCOMPOSE_NAME
    if (!fs.existsSync(dockerComposePath)) {
      return JSON.stringify({
          success: false,
          message: 'No docker-compose found with at: ' + dockerComposePath
      })
    }

    let id = req[0]
    let containers = await dockerCalls.listContainers()
    let container = containers.find( container => container.name.includes(packageName) );
    if (!container) return JSON.stringify({
        success: false,
        message: 'No package found with name: ' + packageName
    })
    // The toggle function will:
    // - stop the package if it's running (container.state == 'running')
    // - run the package if it's stopped  (container.state == 'exited')
    // - return and error if it's in any other state
    switch (container.state) {

      case 'running':
        // stop
        console.log('FIRING A STOP!!')
        await docker_compose.stop(dockerComposePath)
        console.log('FIRED A STOP')
        return JSON.stringify({
            success: true,
            message: 'Package stopped'
        })
        break;

      case 'exited':
        // start
        console.log('FIRING A START!!')
        await docker_compose.start(dockerComposePath)
        console.log('FIRED A START')
        return JSON.stringify({
            success: true,
            message: 'Package started'
        })
        break;

      default:
        // unknown status
        return JSON.stringify({
            success: false,
            message: 'Package: '+container.name+' has an unkown status: '+container.state
        })
    }
}


async function logPackage(req) {

    let packageName = req[0]
    let dockerComposePath = REPO_DIR + packageName + '/' + DOCKERCOMPOSE_NAME

    console.log('LOGGING...')
    let logs = await docker_compose.logs(dockerComposePath)
    console.log('LOGGED')
    return JSON.stringify({
        success: true,
        message: 'Got logs of package: ' + packageName,
        result: logs
    })
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


async function fetchPackageInfo(req) {

  let packageName = parsePackageReq(req[0]).name
  let packageWithVersions = await getPackageVersions({
    name: packageName
  })

  await getManifestOfVersions(packageName, packageWithVersions.versions)

  return JSON.stringify({
      success: true,
      message: "Fetched " + packageName + " info",
      result: packageWithVersions
  })

}


async function getManifestOfVersions(packageName, versions) {

  let manifests = await Promise.all(
    versions.map( async (version) => {
      try {
        version.manifest = await getManifest(packageName + '@' + version.version)
      } catch(e) {
        console.error(Error(e))
        version.manifest = 'Error: '+e.message
      }
    })
  )
}


async function listDirectory(req) {

    let packages = await directoryCalls.getDirectory()

    return JSON.stringify({
        success: true,
        message: "Listing " + packages.length + " packages",
        result: packages
    })

}

async function getPackagesVersions(packages) {
  return await Promise.all(packages.map(getPackageVersions))
}

async function getPackageVersions(_package) {
  _package.versions = await apm.getRepoVersions(_package.name)
  _package.versions.reverse()
  return _package
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
