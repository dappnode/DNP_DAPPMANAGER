const EventEmitter = require('events');

/** HOW TO:
 * - ON:
 * eventBus.on(eventBusTag.logUI, (data) => {
 *   doStuff(data);
 * });
 *
 * - EMIT:
 * eventBus.emit(eventBusTag.logUI, data);
 */
class MyEmitter extends EventEmitter {}

const eventBus = new MyEmitter();

const eventBusTag = {
    emitDirectory: 'EMIT_DIRECTORY',
    emitPackages: 'EMIT_PACKAGES',
    logUI: 'EVENT_BUS_LOGUI',
    call: 'EVENT_BUS_CALL',
    logUserAction: 'EVENT_BUS_LOGUSERACTION',
    emitChainData: 'EMIT_CHAIN_DATA',
  };

module.exports = {
    eventBus,
    eventBusTag,
};
