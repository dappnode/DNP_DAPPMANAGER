'use strict';

// node modules
const autobahn = require('autobahn');
const {eventBus, eventBusTag} = require('eventBus');
const logs = require('logs.js')(module);
const logUserAction = require('logUserAction.js');

// import calls
const installPackage = require('calls/installPackage');
const installPackageSafe = require('calls/installPackageSafe');
const removePackage = require('calls/removePackage');
const togglePackage = require('calls/togglePackage');
const restartPackage = require('calls/restartPackage');
const restartPackageVolumes = require('calls/restartPackageVolumes');
const logPackage = require('calls/logPackage');
const updatePackageEnv = require('calls/updatePackageEnv');
const listPackages = require('calls/listPackages');
const fetchDirectory = require('calls/fetchDirectory');
const fetchPackageVersions = require('calls/fetchPackageVersions');
const fetchPackageData = require('calls/fetchPackageData');
const managePorts = require('calls/managePorts');
const getUserActionLogs = require('calls/getUserActionLogs');
const resolveRequest = require('calls/resolveRequest');
const diskSpaceAvailable = require('calls/diskSpaceAvailable');
const getStats = require('calls/getStats');
/*
 * RPC register wrapper
 * ********************
 * This function absctracts and standarizes the response formating, error handling
 * and logging of errors and actions.
 */

const wrapErrors = (handler, event) =>
  async function(args, kwargs, details) {
    logs.debug('In-call to '+event);
    // 0. args: an array with call arguments
    // 1. kwargs: an object with call arguments
    // 2. details: an object which provides call metadata
    try {
      const res = await handler(kwargs);

      // Log internally
      logUserAction.log({level: 'info', event, ...res, kwargs});
      const eventShort = event.replace('.dappmanager.dnp.dappnode.eth', '');
      if (res.logMessage) {
        logs.info('Call '+eventShort+' success: '+res.message);
      }

      // Return to crossbar
      return JSON.stringify({
        success: true,
        message: res.message,
        result: res.result || {},
      });
    } catch (err) {
      logUserAction.log({level: 'error', event, ...error2obj(err), kwargs});
      logs.error('Call '+event+' error: '+err.message+'\nStack: '+err.stack);
      return JSON.stringify({
        success: false,
        message: err.message,
      });
    }
  };

const register = (session, event, handler) => {
  return session.register(event, wrapErrors(handler, event)).then(
    function(reg) {logs.info('CROSSBAR: registered '+event);},
    function(err) {logs.error('CROSSBAR: error registering '+event+'. Error message: '+err.error);}
  );
};

function error2obj(e) {
  return {name: e.name, message: e.message, stack: e.stack, userAction: true};
}

/*
 * Connection configuration
 * ************************
 * Autobahn.js connects to the WAMP, whos url in defined in params.js
 * On connection open:
 * - all handlers are registered
 * - the native event bus is linked to the session to:
 *   - allow internal calls
 *   - publish progress logs and userAction logs
 * - it subscribe to userAction logs sent by the VPN to store them locally
 */

const params = require('params');

if (process.env.NODE_ENV === 'development') {
  params.autobahnUrl = 'ws://localhost:8080/ws';
  params.autobahnRealm = 'realm1';
}

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
    register(session, 'installPackageSafe.dnp.dappmanager.dnp.dappnode.eth', installPackageSafe);
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
    register(session, 'managePorts.dappmanager.dnp.dappnode.eth', managePorts);
    register(session, 'getUserActionLogs.dappmanager.dnp.dappnode.eth', getUserActionLogs);
    register(session, 'resolveRequest.dappmanager.dnp.dappnode.eth', resolveRequest);
    register(session, 'diskSpaceAvailable.dappmanager.dnp.dappnode.eth', diskSpaceAvailable);
    register(session, 'getStats.dappmanager.dnp.dappnode.eth', getStats);


    /**
     * All the session uses below can throw errors if the session closes.
     * so each single callback is wrapped in a try/catch block
     */

    /**
     * Allows internal calls to autobahn. For example, to call install do:
     * eventBus.emit(eventBusTag.call, 'installPackage.dappmanager.dnp.dappnode.eth', [], { id })
     */
    eventBus.on(eventBusTag.call, (call, args, kwargs) => {
      try {
        session.call(call, args, kwargs)
        .then((res) => {
          logs.info('INTERNAL CALL TO: '+call);
          logs.info(res);
        });
      } catch (e) {
        logs.error('Error on internal call to '+call+': '+e.stack);
      }
    });

    /**
     * Emits the list of packages
     */
    const eventPackages = 'packages.dappmanager.dnp.dappnode.eth';
    const listPackagesWrapped = wrapErrors(listPackages, eventPackages);
    eventBus.on(eventBusTag.emitPackages, () => {
      try {
        listPackagesWrapped().then((res) => {
          session.publish(eventPackages, [], JSON.parse(res));
        });
      } catch (e) {
        logs.error('Error listing packages: '+e.stack);
      }
    });

    /**
     * Emits the directory
     */
    const eventDirectory = 'directory.dappmanager.dnp.dappnode.eth';
    eventBus.on(eventBusTag.emitDirectory, (pkgs) => {
      try {
        session.publish(eventDirectory, [], pkgs);
      } catch (e) {
        logs.error('Error publishing directory: '+e.stack);
      }
    });


    /**
     * Emits progress logs to the ADMIN UI
     */
    eventBus.on(eventBusTag.logUI, (data) => {
      try {
        session.publish('log.dappmanager.dnp.dappnode.eth', [], data);
        if (data && data.msg && !data.msg.includes('%')) {
          logs.info(JSON.stringify(data));
        }
      } catch (e) {
        logs.error('Error publishing progressLog: '+e.stack);
      }
    });

    /**
     * Emits userAction logs to the ADMIN UI
     */
    eventBus.on(eventBusTag.logUserAction, (data) => {
      try {
        session.publish('logUserAction.dappmanager.dnp.dappnode.eth', [], data);
      } catch (e) {
        logs.error('Error publishing user action: '+e.stack);
      }
    });

    /**
     * Receives userAction logs from the VPN nodejs app
     */
    session.subscribe('logUserActionToDappmanager', (args) => {
      try {
        logUserAction.log(args[0]);
      } catch (e) {
        logs.error('Error logging user action: '+e.stack);
      }
    });
};

connection.onclose = (reason, details) => {
  logs.warn('Crossbar connection closed. Reason: '+reason+', details: '+JSON.stringify(details));
};

connection.open();
logs.info('Attempting WAMP connection to '+autobahnUrl+', realm '+autobahnRealm);

