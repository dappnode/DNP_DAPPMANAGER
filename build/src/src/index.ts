import autobahn from "autobahn";
import { eventBus, eventBusTag, eventBusOnSafe } from "./eventBus";
import logUserAction from "./logUserAction";
import { registerHandler } from "./registerHandler";
import params from "./params";
import * as db from "./db";
import {
  ChainDataInterface,
  DirectoryDnp,
  ProgressLogInterface,
  NotificationInterface,
  UserActionLogInterface
} from "./types";
const logs = require("./logs")(module);

// import calls
import * as calls from "./calls";

// Start watchers
import "./watchers/autoUpdates";
import "./watchers/chains";
import "./watchers/diskUsage";
import "./watchers/natRenewal";

// Print version data
import "./utils/getVersionData";

// Start HTTP API
import "./httpApi";

// Initial calls to check this DAppNode's status
calls
  .passwordIsSecure()
  .then(({ result }) => {
    logs.info("Host user password is " + (result ? "secure" : "INSECURE"));
  })
  .catch(e => {
    logs.error(`Error checking if host user password is secure: ${e.message}`);
  });

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

if (process.env.NODE_ENV === "development") {
  params.autobahnUrl = "ws://localhost:8080/ws";
  params.autobahnRealm = "realm1";
}

const url = params.autobahnUrl;
const realm = params.autobahnRealm;
const connection = new autobahn.Connection({ url, realm });

connection.onopen = (session, details) => {
  logs.info(`Connected to DAppNode's WAMP
  url:     ${url}
  realm:   ${realm}
  session: ${(details || {}).authid}`);

  registerHandler(session, "ping.dappmanager.dnp.dappnode.eth", (x: any) => x);
  for (const [callId, callHandler] of Object.entries(calls)) {
    registerHandler(
      session,
      callId + ".dappmanager.dnp.dappnode.eth",
      callHandler
    );
  }

  /**
   * All the session uses below can throw errors if the session closes.
   * so each single callback is wrapped in a try/catch block,
   * via the `eventBusOnSafe` method
   */

  /**
   * Utilities to encode arguments to publish with the Crossbar format (args, kwargs)
   * - Publisher:
   *     publish("event.name", arg1, arg2)
   * - Subscriber:
   *     subscribe("event.name", function(arg1, arg2) {})
   */
  function publish(event: string, ...args: any[]) {
    // session.publish(topic, args, kwargs, options)
    session.publish(event, args);
  }
  function subscribe(event: string, cb: (...args: any[]) => void) {
    // session.subscribe(topic, function(args, kwargs, details) )
    session.subscribe(event, args => {
      try {
        cb(...args);
      } catch (e) {
        logs.error(`Error on WAMP ${event}: ${e.stack}`);
      }
    });
  }

  eventBusOnSafe(
    eventBusTag.emitChainData,
    ({ chainData }: { chainData: ChainDataInterface }) => {
      publish("chainData.dappmanager.dnp.dappnode.eth", chainData);
    }
  );

  // Emits the list of packages
  eventBusOnSafe(
    eventBusTag.emitPackages,
    async () => {
      const dnpList = (await calls.listPackages()).result;
      publish("packages.dappmanager.dnp.dappnode.eth", dnpList);
    },
    { isAsync: true }
  );

  // Emits the directory
  eventBusOnSafe(eventBusTag.emitDirectory, (pkgs: DirectoryDnp[]) => {
    publish("directory.dappmanager.dnp.dappnode.eth", pkgs);
  });

  // Emits the auto update data (settings, registry, pending)
  eventBusOnSafe(
    eventBusTag.emitAutoUpdateData,
    async () => {
      const autoUpdateData = (await calls.autoUpdateDataGet()).result;
      publish("autoUpdateData.dappmanager.dnp.dappnode.eth", autoUpdateData);
    },
    { isAsync: true }
  );

  eventBusOnSafe(eventBusTag.logUi, (logData: ProgressLogInterface) => {
    publish("log.dappmanager.dnp.dappnode.eth", logData);
    // Also, log them internally. But skip download progress logs, too spam-y
    if (!(logData.message || "").includes("%") && !logData.clear) {
      logs.info(JSON.stringify(logData));
    }
  });

  eventBusOnSafe(
    eventBusTag.logUserAction,
    (userActionLog: UserActionLogInterface) => {
      publish("logUserAction.dappmanager.dnp.dappnode.eth", userActionLog);
    }
  );

  /**
   * Receives userAction logs from the VPN nodejs app
   * See above for more details on userActionLog
   */
  subscribe("logUserActionToDappmanager", userActionLog => {
    logUserAction.log(userActionLog);
  });

  eventBusOnSafe(
    eventBusTag.pushNotification,
    async (notification: NotificationInterface) => {
      await db.set(`notification.${notification.id}`, notification);
      publish("pushNotification.dappmanager.dnp.dappnode.eth", notification);
    },
    { isAsync: true }
  );

  /**
   * Initial calls when WAMP is active
   * - When the DAPPMANAGER starts, update the list of packages
   */
  eventBus.emit(eventBusTag.emitPackages);
};

connection.onclose = (reason, details) => {
  logs.warn(
    `WAMP connection closed: ${reason} ${(details || {}).message || ""}`
  );
  return false;
};

connection.open();
logs.info(`Attempting WAMP connection to ${url}, realm: ${realm}`);
