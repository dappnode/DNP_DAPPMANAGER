'use strict'
// node modules
const autobahn = require('autobahn')
const fetch = require('node-fetch')

// import calls
const createInstallPackage   = require('./calls/createInstallPackage')
const createRemovePackage    = require('./calls/createRemovePackage')
const createTogglePackage    = require('./calls/createTogglePackage')
const createLogPackage       = require('./calls/createLogPackage')
const createListPackages     = require('./calls/createListPackages')
const createListDirectory    = require('./calls/createListDirectory')
const { createFetchPackageInfo } = require('./calls/createFetchPackageInfo')
const createUpdatePackageEnv = require('./calls/createUpdatePackageEnv')

// import dependencies
const params = require('./params')
const emitter = require('./modules/emitter')
const DockerCompose = require('./utils/DockerCompose')
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
const dockerCompose = new DockerCompose()
const getDependencies = dependencies.createGetAllResolvedOrdered(getManifest)
const download = pkg.createDownload(params, ipfsCalls)
const run      = pkg.createRun(params, dockerCompose)
const downloadPackages = pkg.createDownloadPackages(download)
const runPackages      = pkg.createRunPackages(run)

// Initialize calls
const installPackage   = createInstallPackage  (getDependencies, downloadPackages, runPackages)
const removePackage    = createRemovePackage   (params, dockerCompose)
const togglePackage    = createTogglePackage   (params, dockerCompose)
const logPackage       = createLogPackage      (params, dockerCompose)
const listPackages     = createListPackages    (params) // Needs work
const listDirectory    = createListDirectory   (getDirectory)
const fetchPackageInfo = createFetchPackageInfo(getManifest, apm)
const updatePackageEnv = createUpdatePackageEnv(params, dockerCompose)

// Initalize app
start()

async function start() {

  const credentials = await getCredentials('core')
  console.log('Successfully fetched credentials for: '+credentials.id)
  const onchallenge = createOnchallenge(credentials.key)

  const autobahnTag = params.autobahnTag
  const autobahnUrl = params.autobahnUrl
  const autobahnRealm = params.autobahnRealm
  const connection = new autobahn.Connection({
    url: autobahnUrl,
    realm: autobahnRealm,
    authmethods: ["wampcra"],
    authid: credentials.id,
    onchallenge: onchallenge
  })

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
    register(session, 'updatePackageEnv.installer.dnp.dappnode.eth', updatePackageEnv)

    emitter.on('log', (log) => {
      log.topic = log.topic || 'general'
      log.type = log.type || 'default'
      log.msg = String(log.msg) || ''
      console.log('LOG, TOPIC: '+log.topic+' MSG('+log.type+'): '+log.msg)
      session.publish(autobahnTag.installerLog, [log])
    })
  }

  console.log('ATTEMPTING TO CONNECT')
  connection.open()

}


///////////////////////////////
// Connection helper functions


async function getCredentials(type) {

  let url, id
  switch (type) {
    case 'core':
      url = 'http://my.wamp.dnp.dappnode.eth:8080/core'
      id = 'coredappnode'
      break
    case 'admin':
      url = 'http://my.wamp.dnp.dappnode.eth:8080/admin'
      id = 'dappnodeadmin'
      break
    default:
      throw Error('Unkown user type')
  }

  const res = await fetch(url, {
    method: 'POST',
    body: '{"procedure": "authenticate.wamp.dnp.dappnode.eth", "args": [{},{},{}]}',
    headers: { 'Content-Type': 'application/json' }
  })

  const resParsed = await res.json()
  const key = resParsed.args[0]
  return {
    id,
    key
  }
}


function createOnchallenge(key) {

  return function(session, method, extra) {
    console.log("onchallenge", method, extra);
    if (method === "wampcra") {
       console.log("authenticating via '" + method + "' and challenge '" + extra.challenge + "'");
       return autobahn.auth_cra.sign(key, extra.challenge);
    } else {
       throw "don't know how to authenticate using '" + method + "'";
    }
  }
}


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
