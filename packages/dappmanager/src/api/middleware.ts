import { EthProviderError } from "../modules/ethClient";
import * as logUserAction from "../logUserAction";
import { Routes, LoggerMiddleware, Args, Result } from "../common";
import { logs } from "../logs";

const routesToLog: (keyof Routes)[] = [
  "autoUpdateSettingsEdit",
  "backupRestore",
  "changeIpfsTimeout",
  "copyFileFrom",
  "copyFileTo",
  "deviceAdd",
  "deviceAdminToggle",
  "deviceRemove",
  "deviceReset",
  "domainAliasSet",
  "ethClientFallbackSet",
  "ethClientTargetSet",
  "packageInstall",
  "packageRemove",
  "packageRestart",
  "packageRestartVolumes",
  "packageSetEnvironment",
  "packageSetPortMappings",
  "packageStartStop",
  "passwordChange",
  "poweroffHost",
  "rebootHost",
  "seedPhraseSet",
  "setStaticIp",
  "volumeRemove"
];

export function routesLoggerFactory(): LoggerMiddleware {
  return {
    onCall: (route: string, args: Args = []): void => {
      logs.debug(`RPC call ${route} data`, args);
    },

    onSuccess: (route: string, result: Result, args: Args = []): void => {
      if (routesToLog.includes(route as keyof Routes)) {
        logUserAction.info({
          event: route,
          message: `${route} success`,
          result,
          args
        });
        logs.info("RPC success", route);
      } else {
        logs.debug("RPC success", route);
      }
    },

    onError: (route: string, error: Error, args: Args = []): void => {
      const msg = error.message;
      if (error instanceof EthProviderError) {
        logs.warn(`Eth provider error, on ${route}: ${msg}`);
      } else if (isSyncingError(msg)) {
        logs.warn(`Chain is still syncing, on ${route}: ${msg}`);
      } else {
        if (isNodeConnectionError(msg))
          logs.warn(`Error connecting to ethchain node, on ${route}: ${msg}`);
        else logs.error("RPC error", route, error);
        logUserAction.error({
          event: route,
          message: error.message,
          stack: error.stack,
          args
        });
      }
    }
  };
}

export function subscriptionsLoggerFactory(): LoggerMiddleware {
  return {
    onError: (route: string, error: Error, args: Args = []): void => {
      logs.error("Subscription error", route, error);
      logs.debug("Subscription error", route, args);
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
