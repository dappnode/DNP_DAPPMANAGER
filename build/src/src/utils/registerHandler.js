const logUserAction = require('../logUserAction');
const logs = require('../logs')(module);

/*
 * RPC register wrapper
 * ********************
 * This function absctracts and standarizes the response formating, error handling
 * and logging of errors and actions.
 */

const wrapErrors = (handler, event) =>
  async function(args, kwargs, details) {
    logs.debug('In-call to ' + event);
    // 0. args: an array with call arguments
    // 1. kwargs: an object with call arguments
    // 2. details: an object which provides call metadata
    try {
      const res = await handler(kwargs);

      // Log internally
      logUserAction.log({level: 'info', event, ...res, kwargs});
      const eventShort = event.replace('.dappmanager.dnp.dappnode.eth', '');
      if (res.logMessage) {
        logs.info('Call ' + eventShort + ' success: ' + res.message);
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
      if (err.message && (err.message.includes('decode 0x from ABI') || err.message.includes('decode address from ABI'))) {
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
      logs.error('Call ' + event + ' error: ' + err.message + '\nStack: ' + err.stack);
      return JSON.stringify({
        success: false,
        message: err.message,
      });
    }
  };

const registerHandler = (session, event, handler) => {
  return session.register(event, wrapErrors(handler, event)).then(
    function(reg) {
      logs.info('CROSSBAR: registered ' + event);
    },
    function(err) {
      logs.error('CROSSBAR: error registering ' + event + '. Error message: ' + err.error);
    }
  );
};

function error2obj(e) {
  return {name: e.name, message: e.message, stack: e.stack, userAction: true};
}

module.exports = {
  registerHandler,
  wrapErrors,
};
