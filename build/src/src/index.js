"use strict";

// node modules
const autobahn = require("autobahn");
const { eventBus, eventBusTag } = require("./eventBus");
const logs = require("./logs")(module);
const logUserAction = require("./logUserAction");
const { registerHandler, wrapErrors } = require("./utils/registerHandler");
const params = require("./params");
const db = require("./db");
const upnpc = require("./modules/upnpc");

// import calls
const calls = require("./calls");

// Start watchers
require("./watchers/chains");
require("./watchers/diskUsage");

/**
 * For debugging, print current version, branch and commit
 * { "version": "0.1.21",
 *   "branch": "master",
 *   "commit": "ab991e1482b44065ee4d6f38741bd89aeaeb3cec" }
 */
let versionData = {};
try {
  versionData = require("../.version.json");
  logs.info(`Version info: \n${JSON.stringify(versionData, null, 2)}`);
} catch (e) {
  logs.error(`Error printing current version ${e.stack}`);
}

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

const autobahnUrl = params.autobahnUrl;
const autobahnRealm = params.autobahnRealm;
const connection = new autobahn.Connection({
  url: autobahnUrl,
  realm: autobahnRealm
});

connection.onopen = (session, details) => {
  logs.info(
    "CONNECTED to DAppnode's WAMP " +
      "\n   url " +
      autobahnUrl +
      "\n   realm: " +
      autobahnRealm +
      "\n   session ID: " +
      details.authid
  );

  registerHandler(session, "ping.dappmanager.dnp.dappnode.eth", () => ({
    result: versionData
  }));
  for (const callId of Object.keys(calls)) {
    registerHandler(
      session,
      callId + ".dappmanager.dnp.dappnode.eth",
      calls[callId]
    );
  }

  /**
   * All the session uses below can throw errors if the session closes.
   * so each single callback is wrapped in a try/catch block
   */

  /**
   * Allows internal calls to autobahn. For example, to call install do:
   * eventBus.emit(eventBusTag.call, 'installPackage.dappmanager.dnp.dappnode.eth', [], { id })
   */
  eventBus.onSafe(
    eventBusTag.call,
    ({ event, callId, args = [], kwargs = {}, callback }) => {
      // Use "callId" to call internal dappmanager methods.
      // Use "event" to call external methods.
      if (callId && !Object.keys(calls).includes(callId)) {
        throw Error(`Requested internal call event does not exist: ${callId}`);
      }
      if (!event) event = callId + ".dappmanager.dnp.dappnode.eth";
      session
        .call(event, args, kwargs)
        .then(JSON.parse)
        .then(res => {
          logs.info(`Internal call to "${event}" result:`);
          logs.info(res);
          if (callback) callback(res);
        });
    }
  );

  // Emit chain data
  const eventChainData = "chainData.dappmanager.dnp.dappnode.eth";
  eventBus.onSafe(eventBusTag.emitChainData, ({ chainData }) => {
    session.publish(eventChainData, chainData); // chainData is an array
  });

  // Emits the list of packages
  const eventPackages = "packages.dappmanager.dnp.dappnode.eth";
  const listPackagesWrapped = wrapErrors(calls.listPackages, eventPackages);
  eventBus.onSafe(eventBusTag.emitPackages, () => {
    listPackagesWrapped().then(res => {
      session.publish(eventPackages, [], JSON.parse(res));
    });
  });

  // Emits the directory
  const eventDirectory = "directory.dappmanager.dnp.dappnode.eth";
  eventBus.onSafe(eventBusTag.emitDirectory, pkgs => {
    session.publish(eventDirectory, [], pkgs);
  });

  // Emits progress logs to the ADMIN UI
  eventBus.onSafe(eventBusTag.logUI, data => {
    session.publish("log.dappmanager.dnp.dappnode.eth", [], data);
    if (data && data.msg && !data.msg.includes("%")) {
      logs.info(JSON.stringify(data));
    }
  });

  // Emits userAction logs to the ADMIN UI
  eventBus.onSafe(eventBusTag.logUserAction, data => {
    session.publish("logUserAction.dappmanager.dnp.dappnode.eth", [], data);
  });

  // Receives userAction logs from the VPN nodejs app
  session.subscribe("logUserActionToDappmanager", args => {
    try {
      logUserAction.log(args[0]);
    } catch (e) {
      logs.error("Error logging user action: " + e.stack);
    }
  });

  // Emits push notification to the UI and to the local db
  eventBus.onSafe(eventBusTag.pushNotification, async notification => {
    await db.set(`notification.${notification.id}`, notification);
    session.publish(
      "pushNotification.dappmanager.dnp.dappnode.eth",
      [],
      notification
    );
  });
};

connection.onclose = (reason, details) => {
  logs.warn(
    "Crossbar connection closed. Reason: " +
      reason +
      ", details: " +
      JSON.stringify(details)
  );
};

connection.open();
logs.info(
  "Attempting WAMP connection to " + autobahnUrl + ", realm " + autobahnRealm
);

/**
 * Initials calls
 */

/**
 * 1. Query UPnP to check if it's available
 */
checkIfUpnpIsAvailable();
async function checkIfUpnpIsAvailable() {
  try {
    const currentPortMappings = await upnpc.list();
    logs.info("UPnP device available");
    logs.info(
      `currentPortMappings: ${JSON.stringify(currentPortMappings, null, 2)}`
    );
    await db.set("upnpAvailable", true);
  } catch (e) {
    if (e.message.includes("NOUPNP")) {
      logs.info("UPnP device NOT available");
    } else {
      logs.error(`Error checking if UPnP device is available: ${e.stack}`);
    }
  }
}
