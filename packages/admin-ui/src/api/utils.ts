import { dappmanagerName, coreName } from "params";

export class PubSub extends EventTarget {
  callbacks: any;
  constructor() {
    super();
    this.callbacks = {};
  }
  emit(route: string, ...args: any) {
    const event = new CustomEvent(route, { detail: args });
    this.dispatchEvent(event);
  }
  on(route: string, callback: any) {
    const listener = (e: CustomEvent) => callback(...e.detail);
    this.callbacks[callback] = listener;
    this.addEventListener(route, listener as EventListener);
  }
  off(route: string, callback: any) {
    const listener = this.callbacks[callback];
    if (listener) this.removeEventListener(route, listener);
  }
}

/**
 * Restarting the DAPPMANAGER will cause this error
 * ```bash
 * Error: wamp.error.canceled - callee disconnected from in-flight request
 * ```
 * Expose this function as a utility of the API to easily modified if autobahn
 * is changed for a regular HTTP RPC
 * @param e
 */
function isCallDisconnectedError(e: Error): boolean {
  return e.message.includes("wamp.error.canceled");
}

/**
 * Wrapper to convert API calls that may throw a callee disconnected error
 * into successful resolved calls
 * @param fn
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
        (!dnpName || dnpName === dappmanagerName || dnpName === coreName)
      )
        return;
      else throw e;
    }
  };
}
