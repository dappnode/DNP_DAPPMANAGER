"use strict";

// node modules
const autobahn = require("autobahn");
const { eventBus, eventBusTag } = require("./eventBus");
const logs = require("./logs")(module);
const logUserAction = require("./logUserAction");
const { registerHandler } = require("./registerHandler");
const params = require("./params");
const db = require("./db");
const { stringIncludes } = require("utils/strings");

// import calls
const calls = require("./calls");

// Start watchers
require("./watchers/chains");
require("./watchers/diskUsage");
require("./watchers/natRenewal");

// Print version data
require("./utils/getVersionData");

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

  registerHandler(session, "ping.dappmanager.dnp.dappnode.eth", x => x);
  for (const callId of Object.keys(calls)) {
    registerHandler(
      session,
      callId + ".dappmanager.dnp.dappnode.eth",
      calls[callId]
    );
  }

  /**
   * All the session uses below can throw errors if the session closes.
   * so each single callback is wrapped in a try/catch block,
   * via the `eventBus.onSafe` method
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

  /**
   * Utilities to encode arguments to publish with the Crossbar format (args, kwargs)
   * - Publisher:
   *     publish("event.name", arg1, arg2)
   * - Subscriber:
   *     subscribe("event.name", function(arg1, arg2) {})
   */
  function publish(event, ...args) {
    // session.publish(topic, args, kwargs, options)
    session.publish(event, args);
  }
  function subscribe(event, cb) {
    // session.subscribe(topic, function(args, kwargs, details) )
    session.subscribe(event, args => {
      try {
        cb(...args);
      } catch (e) {
        logs.error(`Error on WAMP ${event}: ${e.stack}`);
      }
    });
  }

  /**
   * Emit chain data to the UI
   * @param {array} chainData = [{
   *     syncing: true, {bool}
   *     message: "Blocks synced: 543000 / 654000", {string}
   *     progress: 0.83027522935,
   *   }, {
   *     message: "Could not connect to RPC", {string}
   *     error: true {bool},
   *   }, ... ]
   */
  eventBus.onSafe(eventBusTag.emitChainData, ({ chainData }) => {
    publish("chainData.dappmanager.dnp.dappnode.eth", chainData);
  });

  // Emits the list of packages
  eventBus.onSafe(
    eventBusTag.emitPackages,
    async () => {
      const dnpList = (await calls.listPackages()).result;
      publish("packages.dappmanager.dnp.dappnode.eth", dnpList);
    },
    { isAsync: true }
  );

  // Emits the directory
  eventBus.onSafe(eventBusTag.emitDirectory, pkgs => {
    publish("directory.dappmanager.dnp.dappnode.eth", pkgs);
  });

  /**
   * Emit progress logs to the ADMIN UI
   * @param {object} logData = {
   *   id: "ln.dnp.dappnode.eth@/ipfs/Qmabcdf", {string} overall log id (to bundle multiple logs)
   *   name: "bitcoin.dnp.dappnode.eth", {string} dnpName the log is referring to
   *   message: "Downloading 75%", {string} log message
   * }
   */
  eventBus.onSafe(eventBusTag.logUi, logData => {
    publish("log.dappmanager.dnp.dappnode.eth", logData);
    // Also, log them internally. But skip download progress logs, too spam-y
    if (!stringIncludes((logData || {}).message, "%")) {
      logs.info(JSON.stringify(logData));
    }
  });

  /**
   * Emits userAction logs to the UI
   * @param {object} userActionLog = {
   *   level: "info" | "error", {string}
   *   event: "installPackage.dnp.dappnode.eth", {string}
   *   message: "Successfully install DNP", {string} Returned message from the call function
   *   result: { data: "contents" }, {*} Returned result from the call function
   *   kwargs: { id: "dnpName" }, {object} RPC key-word arguments
   *   // Only if error
   *   message: e.message, {string}
   *   stack.e.stack {string}
   * }
   */
  eventBus.onSafe(eventBusTag.logUserAction, userActionLog => {
    publish("logUserAction.dappmanager.dnp.dappnode.eth", userActionLog);
  });

  /**
   * Receives userAction logs from the VPN nodejs app
   * See above for more details on userActionLog
   */
  subscribe("logUserActionToDappmanager", userActionLog => {
    logUserAction.log(userActionLog);
  });

  /**
   * Emits push notification to the UI and to the local db
   * @param {object} notification = {
   *   id: "diskSpaceRanOut-stoppedPackages",
   *   type: "error",
   *   title: "Disk space ran out, stopped packages",
   *   body: "Available disk space is less than a safe ..."",
   * }
   */
  eventBus.onSafe(
    eventBusTag.pushNotification,
    async notification => {
      await db.set(`notification.${notification.id}`, notification);
      publish("pushNotification.dappmanager.dnp.dappnode.eth", notification);
    },
    { isAsync: true }
  );
};

connection.onclose = (reason, details) => {
  logs.warn(
    `WAMP connection closed: ${reason} ${(details || {}).message || ""}`
  );
};

connection.open();
logs.info(`Attempting WAMP connection to ${url}, realm: ${realm}`);

/**
 * HTTP API
 *
 * [NOTE] This API is not secure
 * - It is NOT protected by the IP range filter used in the WAMP
 * - It can't use HTTPS for the limitations with internal IPs certificates
 */

const express = require("express");
const app = express();
const port = 3000;

app.get("/", async (req, res) => {
  return res.send("Welcome to the DAPPMANAGER HTTP API");
});

app.get("/download/:fileId", async (req, res, next) => {
  logs.info(req);
  const { fileId } = req.params;
  const filePath = await db.get(fileId);

  // If path does not exist, return error
  if (!filePath) return next(Error(`No such fileId`));

  // Remove the fileId from the DB FIRST to prevent reply attacks
  await db.remove(fileId);
  return res.download(filePath);
});

app.listen(port, () => logs.info(`HTTP API ${port}!`));
