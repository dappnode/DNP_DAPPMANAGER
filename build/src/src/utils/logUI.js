const { eventBus, eventBusTag } = require("eventBus");

/*
 * Some remote procedure calls (RPC) need a continuous update.
 * This function call be called at any point of the app and it
 * will emit and event received by the autobahn session in index.js
 * which will be broadcasted to clients.
 */

function logUI(data) {
  if (data.name) data.pkg = data.name;
  eventBus.emit(eventBusTag.logUI, data);
}

module.exports = logUI;
