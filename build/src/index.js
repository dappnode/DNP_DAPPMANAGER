'use strict'
// node modules
const autobahn = require('autobahn')

// import calls
const createInstallPackage   = require('./calls/createInstallPackage')
const createRemovePackage    = require('./calls/createRemovePackage')
const createTogglePackage    = require('./calls/createTogglePackage')
const createRestartPackage    = require('./calls/createRestartPackage')
const createRestartPackageVolumes = require('./calls/createRestartPackageVolumes')
const createLogPackage       = require('./calls/createLogPackage')
const createListPackages     = require('./calls/createListPackages')
const createListDirectory    = require('./calls/createListDirectory')
const { createFetchPackageInfo } = require('./calls/createFetchPackageInfo')
const createUpdatePackageEnv = require('./calls/createUpdatePackageEnv')

// import dependencies
const params = require('./params')
const emitter = require('./modules/emitter')
const createDocker = require('./utils/Docker')
const pkg = require('./utils/packages')
const createGetAllResolvedOrdered = require('./utils/dependencies')
const createGetManifest = require('./utils/getManifest')
const dependencies = require('./utils/dependencies')
const createAPM = require('./modules/apm')
const ipfsCalls = require('./modules/ipfsCalls')
const web3Setup = require('./modules/web3Setup')
const createGetDirectory = require('./modules/createGetDirectory')

// initialize dependencies (by order)
const web3 = web3Setup(params) // <-- web3
const apm = createAPM(web3)
const getDirectory = createGetDirectory(web3)
const getManifest = createGetManifest(apm, ipfsCalls)
const docker = createDocker()
const getDependencies = dependencies.createGetAllResolvedOrdered(getManifest, log)
const download = pkg.createDownload(params, ipfsCalls, docker, log)
const run      = pkg.createRun(params, docker, log)
const downloadPackages = pkg.createDownloadPackages(download)
const runPackages      = pkg.createRunPackages(run)

// Initialize calls
const installPackage   = createInstallPackage  (getDependencies, downloadPackages, runPackages)
const removePackage    = createRemovePackage   (params, docker)
const togglePackage    = createTogglePackage   (params, docker)
const restartPackage   = createRestartPackage  (params, docker)
const restartPackageVolumes = createRestartPackageVolumes (params, docker)
const logPackage       = createLogPackage      (params, docker)
const listPackages     = createListPackages    (params) // Needs work
const listDirectory    = createListDirectory   (getDirectory, getManifest, ipfsCalls)
const fetchPackageInfo = createFetchPackageInfo(getManifest, apm)
const updatePackageEnv = createUpdatePackageEnv(params, docker)

const autobahnTag = params.autobahnTag
const autobahnUrl = params.autobahnUrl
const autobahnRealm = params.autobahnRealm
const connection = new autobahn.Connection({ url: autobahnUrl, realm: autobahnRealm })

let session_global;

connection.onopen = function(session, details) {

    console.log("CONNECTED to DAppnode's WAMP "+
      "\n   url "+autobahnUrl+
      "\n   realm: "+autobahnRealm+
      "\n   session ID: "+details.authid)

    register(session, 'installPackage.dappmanager.dnp.dappnode.eth',   installPackage)
    register(session, 'removePackage.dappmanager.dnp.dappnode.eth',    removePackage)
    register(session, 'togglePackage.dappmanager.dnp.dappnode.eth',    togglePackage)
    register(session, 'restartPackage.dappmanager.dnp.dappnode.eth',    restartPackage)
    register(session, 'restartPackageVolumes.dappmanager.dnp.dappnode.eth', restartPackageVolumes)
    register(session, 'logPackage.dappmanager.dnp.dappnode.eth',       logPackage)
    register(session, 'listPackages.dappmanager.dnp.dappnode.eth' ,   listPackages)
    register(session, 'listDirectory.dappmanager.dnp.dappnode.eth',   listDirectory)
    register(session, 'fetchPackageInfo.dappmanager.dnp.dappnode.eth', fetchPackageInfo)
    register(session, 'updatePackageEnv.dappmanager.dnp.dappnode.eth', updatePackageEnv)

    session_global = session
    // emitter.on('log', (log) => {
    //   log.topic = log.topic || 'general'
    //   log.type = log.type || 'default'
    //   log.msg = String(log.msg) || ''
    //   console.log('LOG, TOPIC: '+log.topic+' MSG('+log.type+'): '+log.msg)
    //   session.publish(autobahnTag.installerLog, [log])
    // })

}

function log(data) {
  session_global.publish(autobahnTag.DAppManagerLog, [data])
  console.log('\x1b[35m%s\x1b[0m',JSON.stringify(data))
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



// async function getPackagesVersions(packages) {
//   return await Promise.all(packages.map(getPackageVersions))
// }




///////////////////////////////
// Helper functions
