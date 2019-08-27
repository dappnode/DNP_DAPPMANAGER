import EventEmitter from "events";
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

export const eventBus = new MyEmitter();

export const eventBusTag = {
  emitDirectory: "EMIT_DIRECTORY",
  emitPackages: "EMIT_PACKAGES",
  emitAutoUpdateData: "EMIT_AUTO_UPDATE_DATA",
  logUi: "EVENT_BUS_LOGUI",
  call: "INTERNAL_CALL",
  logUserAction: "EVENT_BUS_LOGUSERACTION",
  emitChainData: "EMIT_CHAIN_DATA",
  requestedChainData: "REQUEST_CHAIN_DATA",
  pushNotification: "PUSH_NOTIFICATION",
  runNatRenewal: "RUN_NAT_RENEWAL",
  packageModified: "PACKAGE_MODIFIED"
};

/**
 * Offer a default mechanism to run listeners within a try/catch block
 *
 * [NOTE] Error parsing `e.stack || e.message || e` is necessary because
 * there has been instances where the error captured didn't had the stack
 * property
 */

export function eventBusOnSafe(
  eventName: string,
  listener: (...args: any[]) => void,
  options?: { isAsync: boolean }
) {
  if (options && options.isAsync) {
    eventBus.on(eventName, async (...args: any[]) => {
      try {
        await listener(...args);
      } catch (e) {
        logs.error(
          `Error on event '${eventName}': ${e.stack || e.message || e}`
        );
      }
    });
  } else {
    eventBus.on(eventName, (...args: any[]) => {
      try {
        listener(...args);
      } catch (e) {
        logs.error(
          `Error on event '${eventName}': ${e.stack || e.message || e}`
        );
      }
    });
  }
}
