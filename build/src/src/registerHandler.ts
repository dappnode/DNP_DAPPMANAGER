import logUserAction from "./logUserAction";
import { Session } from "autobahn";
import { RpcHandlerReturnGeneric } from "./types";
import Logs from "./logs";
import { EthProviderError } from "./modules/ethClient";
const logs = Logs(module);

/*
 * RPC register wrapper
 * ********************
 * This function absctracts and standarizes the response formating, error handling
 * and logging of errors and actions.
 */

export const wrapErrors = <K>(
  handler: (kwargs: K) => RpcHandlerReturnGeneric,
  event: string
) =>
  // function(args, kwargs, details)
  async function wrappedHandler(
    // crossbar's session.register requires _0: `any[] | undefined`
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    _0: any[] | undefined,
    kwargs: K
  ): Promise<string> {
    if (!kwargs) kwargs = {} as K;
    logs.debug(`In-call to ${event}`);
    // 0. args: an array with call arguments
    // 1. kwargs: an object with call arguments
    // 2. details: an object which provides call metadata
    try {
      const res = await handler(kwargs);
      /**
       * res = { message, result }
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
        result: res.result
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
      } else if (
        msg.includes("connection not open") ||
        e instanceof EthProviderError
      ) {
        /**
         * 2. When attempting an JSON RPC but the connection with the node is closed
         * - Emit a userActionLog
         * - Print a warning only
         */
        logs.warn(`Eth provider error on ${event}: ${msg}`);
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

export const registerHandler = (
  session: Session,
  event: string,
  handler: (kwargs: any) => RpcHandlerReturnGeneric
): void => {
  session.register(event, wrapErrors(handler, event)).then(
    () => {
      logs.info(`Registered event: ${event}`);
    },
    e => {
      logs.error(`Error registering event ${event}: ${(e || {}).error}`);
    }
  );
};

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
function error2obj(e: Error) {
  return { message: e.message, stack: e.stack, userAction: true };
}
