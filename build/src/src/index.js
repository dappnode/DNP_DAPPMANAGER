'use strict';

// node modules
const autobahn = require('autobahn');
const {eventBus, eventBusTag} = require('./eventBus');
const logs = require('./logs')(module);
const logUserAction = require('./logUserAction');
const params = require('./params');

// import calls
const calls = require('./calls');

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
      // Rename known shit-errors
      // When attempting to call a contract while the chain is syncing:
      if (err.message && (err.message.includes('decode 0x from ABI')
        || err.message.includes('decode address from ABI'))) {
        err.code = 'SYNCING';
        err.message = `Chain is still syncing: ${err.message}`;
      }
      // When attempting an JSON RPC but the connection with the node is closed:
      if (err.message && err.message.includes('connection not open')) {
        err.message = `Could not connect to ethchain: ${err.message}`;
      }

      // ##### Don't reflect logId in the userActions logs (delete w/ immutable method)
      const _kwargs = Object.assign({}, kwargs);
      if (_kwargs && _kwargs.logId) delete _kwargs.logId;

      // Don't log to userActions is "SYNCING" errors
      if (err.code !== 'SYNCING') {
        logUserAction.log({level: 'error', event, ...error2obj(err), kwargs: _kwargs});
      }
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
    for (const callId of Object.keys(calls)) {
      register(session, callId+'.dappmanager.dnp.dappnode.eth', calls[callId]);
    }


    /**
     * All the session uses below can throw errors if the session closes.
     * so each single callback is wrapped in a try/catch block
     */

    /**
     * Allows internal calls to autobahn. For example, to call install do:
     * eventBus.emit(eventBusTag.call, 'installPackage.dappmanager.dnp.dappnode.eth', [], { id })
     */
    eventBus.on(eventBusTag.call, ({event, callId, args = [], kwargs = {}, callback}) => {
      try {
        // Use "callId" to call internal dappmanager methods.
        // Use "event" to call external methods.
        if (callId && !Object.keys(calls).includes(callId)) {
          throw Error(`Requested internal call event does not exist: ${callId}`);
        }
        if (!event) event = callId+'.dappmanager.dnp.dappnode.eth';
        session.call(event, args, kwargs)
        .then(JSON.parse)
        .then((res) => {
          logs.info(`Internal call to "${event}" result:`);
          logs.info(res);
          if (callback) callback(res);
        });
      } catch (e) {
        logs.error(`Error on internal call to ${event}: ${e.stack}`);
      }
    });

    /**
     * Emits the list of packages
     */
    const eventPackages = 'packages.dappmanager.dnp.dappnode.eth';
    const listPackagesWrapped = wrapErrors(calls.listPackages, eventPackages);
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

