'use strict';
// node modules
const autobahn = require('autobahn');
const {eventBus, eventBusTag} = require('./eventBus');

// import calls
const createInstallPackage = require('./calls/createInstallPackage');
const createRemovePackage = require('./calls/createRemovePackage');
const createTogglePackage = require('./calls/createTogglePackage');
const createRestartPackage = require('./calls/createRestartPackage');
const createRestartPackageVolumes = require('./calls/createRestartPackageVolumes');
const createLogPackage = require('./calls/createLogPackage');
const createListPackages = require('./calls/createListPackages');
const createListDirectory = require('./calls/createListDirectory');
const {createFetchPackageInfo} = require('./calls/createFetchPackageInfo');
const createGetPackageData = require('./calls/createGetPackageData');
const createUpdatePackageEnv = require('./calls/createUpdatePackageEnv');

// import dependencies
const params = require('./params');
const {createDocker} = require('./utils/Docker');
const pkg = require('./utils/packages');
const createGetManifest = require('./utils/getManifest');
const dependencies = require('./utils/dependencies');
const createAPM = require('./modules/apm');
const ipfsFactory = require('./modules/ipfs');
const web3Setup = require('./modules/web3Setup');
const createGetDirectory = require('./modules/createGetDirectory');

// Initialize watchers
// require('./watchers');

// initialize dependencies (by order)
const web3 = web3Setup(params); // <-- web3
const ipfs = ipfsFactory({}); // <-- ipfs
const apm = createAPM(web3);
const getDirectory = createGetDirectory(web3);
const getManifest = createGetManifest(apm, ipfs);
const docker = createDocker();
const getDependencies = dependencies.createGetAllResolvedOrdered(getManifest);
const download = pkg.downloadFactory({params, ipfs, docker});
const run = pkg.runFactory({params, docker});

// Initialize calls
const installPackage = createInstallPackage(getDependencies, download, run);
const removePackage = createRemovePackage(params, docker);
const togglePackage = createTogglePackage(params, docker);
const restartPackage = createRestartPackage(params, docker);
const restartPackageVolumes = createRestartPackageVolumes(params, docker);
const logPackage = createLogPackage(params, docker);
const listPackages = createListPackages(params); // Needs work
const listDirectory = createListDirectory(getDirectory);
const fetchPackageInfo = createFetchPackageInfo(getManifest, apm);
const updatePackageEnv = createUpdatePackageEnv(params, docker);
const getPackageData = createGetPackageData(getManifest, ipfs);

const autobahnTag = params.autobahnTag;
const autobahnUrl = params.autobahnUrl;
const autobahnRealm = params.autobahnRealm;
const connection = new autobahn.Connection({url: autobahnUrl, realm: autobahnRealm});


connection.onopen = function(session, details) {
    console.log('CONNECTED to DAppnode\'s WAMP '+
      '\n   url '+autobahnUrl+
      '\n   realm: '+autobahnRealm+
      '\n   session ID: '+details.authid);

    register(session, 'ping.dappmanager.dnp.dappnode.eth', (x) => x);
    register(session, 'greet.dappmanager.dnp.dappnode.eth', () => 'Hello from the dappmanager');
    register(session, 'installPackage.dappmanager.dnp.dappnode.eth', installPackage);
    register(session, 'removePackage.dappmanager.dnp.dappnode.eth', removePackage);
    register(session, 'togglePackage.dappmanager.dnp.dappnode.eth', togglePackage);
    register(session, 'restartPackage.dappmanager.dnp.dappnode.eth', restartPackage);
    register(session, 'restartPackageVolumes.dappmanager.dnp.dappnode.eth', restartPackageVolumes);
    register(session, 'logPackage.dappmanager.dnp.dappnode.eth', logPackage);
    register(session, 'listPackages.dappmanager.dnp.dappnode.eth', listPackages);
    register(session, 'listDirectory.dappmanager.dnp.dappnode.eth', listDirectory);
    register(session, 'fetchPackageInfo.dappmanager.dnp.dappnode.eth', fetchPackageInfo);
    register(session, 'updatePackageEnv.dappmanager.dnp.dappnode.eth', updatePackageEnv);
    register(session, 'getPackageData.dappmanager.dnp.dappnode.eth', getPackageData);


    // emitter.on('log', (log) => {
    //   log.topic = log.topic || 'general'
    //   log.type = log.type || 'default'
    //   log.msg = String(log.msg) || ''
    //   console.log('LOG, TOPIC: '+log.topic+' MSG('+log.type+'): '+log.msg)
    //   session.publish(autobahnTag.installerLog, [log])
    // })
    eventBus.on(eventBusTag.call, (call, args) => {
      session.call(call, args)
      .then((res) => {
        console.log('INTERNAL CALL TO: '+call);
        console.trace(res);
      });
    });

    eventBus.on(eventBusTag.logUI, (data) => {
      session.publish(autobahnTag.DAppManagerLog, [data]);
      console.log('\x1b[35m%s\x1b[0m', JSON.stringify(data));
    });
};


connection.onclose = function(reason, details) {
  console.log('[index.js connection.onclose] reason: '+reason+' details '+JSON.stringify(details));
};


connection.open();


// /////////////////////////////
// Connection helper functions


function register(session, event, handler) {
  const SUCCESS_MESSAGE = '---------------------- \n procedure registered';
  const ERROR_MESSAGE = '------------------------------ \n failed to register procedure ';

  return session.register(event, wrapErrors(handler)).then(
    function(reg) {console.log(SUCCESS_MESSAGE);},
    function(err) {console.log(ERROR_MESSAGE, err);}
  );
}


function wrapErrors(handler) {
  // 0. args: an array with call arguments
  // 1. kwargs: an object with call arguments
  // 2. details: an object which provides call metadata

  return async function(args, kwargs) {
    try {
      return await handler(kwargs);
    } catch (err) {
      console.log(err);

      return JSON.stringify({
        success: false,
        message: err.message,
      });
    }
  };
}


// /////////////////////////////
// Main functions


// async function getPackagesVersions(packages) {
//   return await Promise.all(packages.map(getPackageVersions))
// }


// /////////////////////////////
// Helper functions
