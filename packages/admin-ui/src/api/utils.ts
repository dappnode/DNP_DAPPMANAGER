import { dappmanagerDnpName, coreDnpName } from "params";
import { Args } from "@dappnode/common";

/**
 * Restarting the DAPPMANAGER will cause this error
 * ```bash
 * Error: wamp.error.canceled - callee disconnected from in-flight request
 * ```
 * Expose this function as a utility of the API to easily modified if autobahn
 * is changed for a regular HTTP RPC
 */
function isCallDisconnectedError(e: Error): boolean {
  return e.message.includes("wamp.error.canceled");
}

/**
 * Wrapper to convert API calls that may throw a callee disconnected error
 * into successful resolved calls
 */
export function continueIfCalleDisconnected(
  fn: () => Promise<void>,
  dnpName: string
): () => Promise<void> {
  return async function(...args) {
    try {
      await fn(...args);
    } catch (e) {
      if (
        isCallDisconnectedError(e) &&
        (!dnpName || dnpName === dappmanagerDnpName || dnpName === coreDnpName)
      )
        return;
      else throw e;
    }
  };
}

export const subscriptionsLogger = {
  onError: (route: string, error: Error, args?: Args): void => {
    console.error(`Subscription error ${route}: ${error.stack}`, args);
  }
};
