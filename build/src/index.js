'use strict';
// node modules
const autobahn = require('autobahn');
const {eventBus, eventBusTag} = require('./eventBus');
const logs = require('./logs.js')(module);

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
const ipfsCalls = require('./modules/ipfsCalls');
const web3Setup = require('./modules/web3Setup');
const createGetDirectory = require('./modules/createGetDirectory');

// Initialize watchers
require('./watchers');

// initialize dependencies (by order)
const web3 = web3Setup(params); // <-- web3
const apm = createAPM(web3);
const getDirectory = createGetDirectory(web3);
const getManifest = createGetManifest(apm, ipfsCalls);
const docker = createDocker();
const getDependencies = dependencies.createGetAllResolvedOrdered(getManifest);
const download = pkg.downloadFactory({params, ipfsCalls, docker});
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
const getPackageData = createGetPackageData(getManifest, ipfsCalls);

// /////////////////////////////
// Connection helper functions

const register = (session, event, handler) => {
  const wrapErrors = (handler) =>
    async function(args, kwargs) {
      logs.debug('In-call to '+event);
      // 0. args: an array with call arguments
      // 1. kwargs: an object with call arguments
      // 2. details: an object which provides call metadata
      try {
        const res = await handler(kwargs);
        // Log internally
        const eventShort = event.replace('.dappmanager.dnp.dappnode.eth', '');
        if (res.log && res.result) logs.info('Result of '+eventShort+': '+JSON.stringify(res));
        else if (res.log && !res.result) logs.info('Result of '+eventShort+': '+res.message);
        else if (res.logMessage) logs.info('Result of '+eventShort+': '+res.message);
        // Return to crossbar
        return JSON.stringify({
          success: true,
          message: res.message,
          result: res.result || {},
        });
      } catch (err) {
        logs.error(err);
        return JSON.stringify({
          success: false,
          message: err.message,
        });
      }
    };

  return session.register(event, wrapErrors(handler)).then(
    function(reg) {logs.info('CROSSBAR: registered '+event);},
    function(err) {logs.error('CROSSBAR: error registering '+event, err);}
  );
};


// /////////////////////////////
// Configure connection:

const autobahnTag = params.autobahnTag;
const autobahnUrl = params.autobahnUrl;
const autobahnRealm = params.autobahnRealm;
const connection = new autobahn.Connection({url: autobahnUrl, realm: autobahnRealm});

connection.onopen = (session, details) => {
    logs.info('CONNECTED to DAppnode\'s WAMP '+
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

    eventBus.on(eventBusTag.call, (call, args) => {
      session.call(call, args)
      .then((res) => {
        logs.info('INTERNAL CALL TO: '+call);
        logs.info(res);
      });
    });

    eventBus.on(eventBusTag.logUI, (data) => {
      session.publish(autobahnTag.DAppManagerLog, [data]);
      logs.info('\x1b[35m%s\x1b[0m', JSON.stringify(data));
    });
};


connection.onclose = (reason, details) => {
  logs.warn('Crossbar connection closed. Reason: '+reason+', details: '+JSON.stringify(details));
};


connection.open();


// /////////////////////////////
// Main functions


// async function getPackagesVersions(packages) {
//   return await Promise.all(packages.map(getPackageVersions))
// }


// /////////////////////////////
// Helper functions
