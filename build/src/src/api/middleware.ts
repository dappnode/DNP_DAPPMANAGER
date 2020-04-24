import logUserAction from "../logUserAction";
import { RouteData } from "../common/routes";
import { EthProviderError } from "../modules/ethClient";
import { LoggerMiddleware, Args, Result } from "../common/transport/types";
import { SubscriptionData } from "../common/subscriptions";
import Logs from "../logs";
const logs = Logs(module);

export function routesLoggerFactory(routesData: {
  [route: string]: RouteData;
}): LoggerMiddleware {
  return {
    onCall: (route: string, args?: Args): void => {
      logs.debug(`RPC call ${route} data`, { args });
    },

    onSuccess: (route: string, result: Result, args?: Args): void => {
      if ((routesData[route] || {}).log) {
        logUserAction.log({
          level: "info",
          event: route,
          message: `${route} success`,
          result,
          args
        });
        logs.info(`RPC success ${route}`);
      } else {
        logs.debug(`RPC success ${route}`);
      }
    },

    onError: (route: string, error: Error, args?: Args): void => {
      const msg = error.message;
      if (error instanceof EthProviderError) {
        logs.warn(`Eth provider error, on ${route}: ${msg}`);
      } else if (isSyncingError(msg)) {
        logs.warn(`Chain is still syncing, on ${route}: ${msg}`);
      } else {
        if (isNodeConnectionError(msg))
          logs.warn(`Error connecting to ethchain node, on ${route}: ${msg}`);
        else logs.error(`RPC error ${route}: ${error.stack}`);
        logUserAction.log({
          level: "error",
          event: route,
          message: error.message,
          stack: error.stack,
          args
        });
      }
    }
  };
}

export function subscriptionsLoggerFactory(subscriptionsData: {
  [route: string]: SubscriptionData;
}): LoggerMiddleware {
  // To be used to customize behaviour
  subscriptionsData;
  return {
    onError: (route: string, error: Error, args?: Args): void => {
      logs.error(`Subscription error ${route}: ${error.stack}`);
      logs.debug(`Subscription error ${route} data`, { args });
    }
  };
}

/**
 * When attempting a JSON RPC but the connection with the node is closed
 */
function isNodeConnectionError(msg: string): boolean {
  return msg.includes("connection not open");
}

/**
 * When attempting to call a contract while the chain is syncing
 */
function isSyncingError(msg: string): boolean {
  return (
    msg.includes("decode 0x from ABI") ||
    msg.includes("decode address from ABI")
  );
}
