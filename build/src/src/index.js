'use strict';
// node modules
const autobahn = require('autobahn');
const {eventBus, eventBusTag} = require('eventBus');
const logs = require('logs.js')(module);

// import calls
const createInstallPackage = require('calls/createInstallPackage');
const createRemovePackage = require('calls/createRemovePackage');
const createTogglePackage = require('calls/createTogglePackage');
const createRestartPackage = require('calls/createRestartPackage');
const createRestartPackageVolumes = require('calls/createRestartPackageVolumes');
const createLogPackage = require('calls/createLogPackage');
const createUpdatePackageEnv = require('calls/createUpdatePackageEnv');
const createListPackages = require('calls/createListPackages');
const createFetchDirectory = require('calls/createFetchDirectory');
const createFetchPackageVersions = require('calls/createFetchPackageVersions');
const createFetchPackageData = require('calls/createFetchPackageData');
const createOpenPorts = require('calls/createOpenPorts');

// import dependencies
const params = require('params');
const pkg = require('utils/packages');
const createGetManifest = require('utils/getManifest');
const dependencies = require('utils/dependencies');
const apmFactory = require('modules/apm');
const createGetDirectory = require('modules/createGetDirectory');

// Initialize watchers
// require('./watchers');

// initialize dependencies (by order)
const apm = apmFactory({});
const getDirectory = createGetDirectory({});
const getManifest = createGetManifest({apm});
const getAllDependencies = dependencies.createGetAllResolvedOrdered(getManifest);
const download = pkg.downloadFactory({});
const run = pkg.runFactory({});

// Initialize calls
const installPackage = createInstallPackage({getAllDependencies, download, run});
const removePackage = createRemovePackage({});
const togglePackage = createTogglePackage({});
const restartPackage = createRestartPackage({});
const restartPackageVolumes = createRestartPackageVolumes({});
const logPackage = createLogPackage({});
const listPackages = createListPackages({}); // Needs work
const fetchDirectory = createFetchDirectory({getDirectory});
const fetchPackageVersions = createFetchPackageVersions({getManifest, apm});
const updatePackageEnv = createUpdatePackageEnv({});
const fetchPackageData = createFetchPackageData({getManifest});
const openPorts = createOpenPorts({});

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
        logs.error(' Event: '+event+' Stack: '+err.stack);
        return JSON.stringify({
          success: false,
          message: err.message,
        });
      }
    };

  return session.register(event, wrapErrors(handler)).then(
    function(reg) {logs.info('CROSSBAR: registered '+event);},
    function(err) {logs.error('CROSSBAR: error registering '+event+'. Error message: '+err.error);}
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
    register(session, 'installPackage.dappmanager.dnp.dappnode.eth', installPackage);
    register(session, 'removePackage.dappmanager.dnp.dappnode.eth', removePackage);
    register(session, 'togglePackage.dappmanager.dnp.dappnode.eth', togglePackage);
    register(session, 'restartPackage.dappmanager.dnp.dappnode.eth', restartPackage);
    register(session, 'restartPackageVolumes.dappmanager.dnp.dappnode.eth', restartPackageVolumes);
    register(session, 'logPackage.dappmanager.dnp.dappnode.eth', logPackage);
    register(session, 'updatePackageEnv.dappmanager.dnp.dappnode.eth', updatePackageEnv);
    register(session, 'listPackages.dappmanager.dnp.dappnode.eth', listPackages);
    register(session, 'fetchDirectory.dappmanager.dnp.dappnode.eth', fetchDirectory);
    register(session, 'fetchPackageVersions.dappmanager.dnp.dappnode.eth', fetchPackageVersions);
    register(session, 'fetchPackageData.dappmanager.dnp.dappnode.eth', fetchPackageData);
    register(session, 'openPorts.dappmanager.dnp.dappnode.eth', openPorts);

    eventBus.on(eventBusTag.call, (call, args, kwargs) => {
      session.call(call, args, kwargs)
      .then((res) => {
        logs.info('INTERNAL CALL TO: '+call);
        logs.info(res);
      });
    });

    // To call install:
    // session.call(
    //   'installPackage.dappmanager.dnp.dappnode.eth',
    //   [],
    //   { id }
    // )

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
