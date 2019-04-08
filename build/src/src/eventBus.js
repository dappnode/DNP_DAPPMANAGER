const EventEmitter = require("events");
const logs = require("./logs")(module);

/** HOW TO:
 * - ON:
 * eventBus.on(eventBusTag.logUi, (data) => {
 *   doStuff(data);
 * });
 *
 * - EMIT:
 * eventBus.emit(eventBusTag.logUi, data);
 */
class MyEmitter extends EventEmitter {}

const eventBus = new MyEmitter();

const eventBusTag = {
  emitDirectory: "EMIT_DIRECTORY",
  emitPackages: "EMIT_PACKAGES",
  logUi: "EVENT_BUS_LOGUI",
  call: "INTERNAL_CALL",
  logUserAction: "EVENT_BUS_LOGUSERACTION",
  emitChainData: "EMIT_CHAIN_DATA",
  pushNotification: "PUSH_NOTIFICATION"
};

// Offer a default mechanism to run listeners within a try/catch block
(eventBus.onSafe = (eventName, listener) => {
  eventBus.on(eventName, (...args) => {
    try {
      listener(...args);
    } catch (e) {
      logs.error(`Error on event '${eventName}': ${e.stack}`);
    }
  });
}),
  (module.exports = {
    eventBus,
    eventBusTag
  });
