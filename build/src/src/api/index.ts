import autobahn from "autobahn";
import * as calls from "../calls";
import { mapSubscriptionsToEventBus } from "./subscriptions";
import { routesLoggerFactory, subscriptionsLoggerFactory } from "./middleware";
// Types
import { Routes, routesData } from "../common/routes";
import { Subscriptions, subscriptionsData } from "../common/subscriptions";
// Transport autobahn
import {
  registerRoute,
  subscriptionsFactory
} from "../common/transport/autobahn";
import Logs from "../logs";
const logs = Logs(module);

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

    // Construct loggers
    const routesLogger = routesLoggerFactory(routesData);
    const subscriptionsLogger = subscriptionsLoggerFactory(subscriptionsData);

    // Type assertion of calls <> Routes happen here
    const routes: Routes = calls;

    for (const [route, handler] of Object.entries(routes)) {
      registerRoute(session, route, handler, routesLogger).then(
        () => logs.info(`Registered event: ${route}`),
        e => logs.error(`Error registering event ${route}: ${(e || {}).error}`)
      );
    }

    /**
     * All the session uses below can throw errors if the session closes.
     * so each single callback is wrapped in a try/catch block,
     * via the `eventBusOnSafe` method
     */

    const subscriptions = subscriptionsFactory<Subscriptions>(
      session,
      subscriptionsData,
      subscriptionsLogger
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
