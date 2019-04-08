const logUserAction = require("../logUserAction");
const logs = require("../logs")(module);

/*
 * RPC register wrapper
 * ********************
 * This function absctracts and standarizes the response formating, error handling
 * and logging of errors and actions.
 */

const wrapErrors = (handler, event) =>
  // function(args, kwargs, details)
  async function(_, kwargs) {
    logs.debug("In-call to " + event);
    // 0. args: an array with call arguments
    // 1. kwargs: an object with call arguments
    // 2. details: an object which provides call metadata
    try {
      const res = await handler(kwargs);
      /**
       * res = { message, result, ... }
       */

      // Log internally
      logUserAction.log({ level: "info", event, ...res, kwargs });
      const eventShort = event.replace(".dappmanager.dnp.dappnode.eth", "");
      if (res.logMessage) {
        logs.info(`RPC ${eventShort} success: ${res.message}`);
      }

      // Return to crossbar
      return JSON.stringify({
        success: true,
        message: res.message,
        result: res.result || {}
      });
    } catch (e) {
      const msg = e.message || ""; // alias to simplify code

      /**
       * Rename known shit-errors
       * 1. Ethchain is still syncing
       * 2. Ethcain's JSON RPC is unreachable
       */
      if (
        msg.includes("decode 0x from ABI") ||
        msg.includes("decode address from ABI")
      ) {
        /**
         * 1. When attempting to call a contract while the chain is syncing
         * - Do not emit a userActionLog
         * - Print a warning only
         */
        logs.warn(`Chain is still syncing, on ${event}: ${msg}`);
      } else if (msg.includes("connection not open")) {
        /**
         * 2. When attempting an JSON RPC but the connection with the node is closed
         * - Emit a userActionLog
         * - Print a warning only
         */
        logs.warn(`Could not connect to ethchain node, on ${event}: ${msg}`);
        logUserAction.log({ level: "error", event, ...error2obj(e), kwargs });
      } else {
        /**
         * 0. Else
         * - Emit a userActionLog
         * - Print an error
         */
        logs.error(`Error on ${event}: ${e.stack}`);
        logUserAction.log({ level: "error", event, ...error2obj(e), kwargs });
      }

      return JSON.stringify({
        success: false,
        message: e.message
      });
    }
  };

const registerHandler = (session, event, handler) => {
  return session.register(event, wrapErrors(handler, event)).then(
    () => {
      logs.info(`Registered event: ${event}`);
    },
    e => {
      logs.error(`Error registering event ${event}: ${(e || {}).error}`);
    }
  );
};

function error2obj(e) {
  return { name: e.name, message: e.message, stack: e.stack, userAction: true };
}

module.exports = {
  registerHandler,
  wrapErrors
};
