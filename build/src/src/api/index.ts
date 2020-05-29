import autobahn from "autobahn";
import * as calls from "../calls";
import { mapSubscriptionsToEventBus } from "./subscriptions";
import { routesLoggerFactory, subscriptionsLoggerFactory } from "./middleware";
// Types
import { Routes } from "../common/routes";
import { Subscriptions, subscriptionsData } from "../common/subscriptions";
import { RpcResult } from "../common/transport/types";
// Transport autobahn
import {
  subscriptionsFactory,
  parseWampError,
  registerRoutes
} from "./legacy-autobahn";
import {
  validateRoutesArgsFactory,
  validateSubscriptionsArgsFactory
} from "../common/validation";
import Logs from "../logs";
const logs = Logs(module);

let _session: autobahn.Session;

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
export async function startAutobahn({
  url,
  realm
}: {
  url: string;
  realm: string;
}): Promise<void> {
  const connection = new autobahn.Connection({ url, realm });
  connection.onopen = (session, details): void => {
    logs.info(`Connected to DAppNode's WAMP
  url:     ${url}
  realm:   ${realm}
  session: ${(details || {}).authid}`);

    _session = session;

    // Type assertion of calls <> Routes happen here
    registerRoutes<Routes>(session, calls, {
      loggerMiddleware: routesLoggerFactory(),
      validateArgs: validateRoutesArgsFactory()
    }).then(registrationResults => {
      for (const { ok, message } of registrationResults) {
        if (ok) logs.info(message);
        else logs.info(message);
      }
    });

    /**
     * All the session uses below can throw errors if the session closes.
     * so each single callback is wrapped in a try/catch block,
     * via the `eventBusOnSafe` method
     */

    const subscriptions = subscriptionsFactory<Subscriptions>(
      session,
      subscriptionsData,
      {
        loggerMiddleware: subscriptionsLoggerFactory(),
        validateArgs: validateSubscriptionsArgsFactory()
      }
    );

    mapSubscriptionsToEventBus(subscriptions);
  };

  connection.onclose = (reason, details): boolean => {
    logs.warn(`WAMP connection closed: ${reason} ${(details || {}).message}`);
    return false;
  };

  connection.open();
  logs.info(`Attempting WAMP connection to ${url}, realm: ${realm}`);
}

/**
 * Call a VPN WAMP endpoint (LEGACY format)
 * @param route "addDevice"
 * @param args { id: "admin" }
 * ```js
 * vpnWampCall("addDevice", { id })
 * ```
 */
export async function vpnWampCall<R>(
  route: string,
  kwargs: { [key: string]: any } = {}
): Promise<R> {
  if (!_session) throw Error(`Session not started`);
  if (!_session.isOpen) throw Error(`Session not open`);

  try {
    const res: RpcResult<R> = await _session
      .call<RpcResult<R>>(route + ".vpn.dnp.dappnode.eth", [], kwargs)
      .then(res => (typeof res === "string" ? JSON.parse(res) : res));
    // Handle route implementation errors
    if (res.success) return res.result;
    else throw Error(res.message);
  } catch (e) {
    const err: Error = parseWampError(e);
    throw err;
  }
}
