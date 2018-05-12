'use strict'
// node modules
const autobahn = require('autobahn')

// import calls
const installPackage   = require('./calls/installPackage')
const removePackage    = require('./calls/removePackage')
const togglePackage    = require('./calls/togglePackage')
const logPackage       = require('./calls/logPackage')
const listPackages     = require('./calls/listPackages')
const listDirectory    = require('./calls/listDirectory')
const fetchPackageInfo = require('./calls/fetchPackageInfo')
const updatePackageEnv = require('./calls/updatePackageEnv')

// import params
const params = require('./params')
const emitter = require('./modules/emitter')

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
    register(session, 'updatePackageEnv.installer.dnp.dappnode.eth', updatePackageEnv)

    // ###### FOR DEVELOPMENT - simulating an install call
    // ###### FOR DEVELOPMENT - simulating an install call

    setTimeout(function(){
      let link = 'otpweb.dnp.dappnode.eth'
      // session.call('fetchPackageInfo.installer.dnp.dappnode.eth', [link])
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



// async function getPackagesVersions(packages) {
//   return await Promise.all(packages.map(getPackageVersions))
// }




///////////////////////////////
// Helper functions
