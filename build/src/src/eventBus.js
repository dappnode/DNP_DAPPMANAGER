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
    logUI: 'EVENT_BUS_LOGUI',
    call: 'EVENT_BUS_CALL',
    logUserAction: 'EVENT_BUS_LOGUSERACTION',
  };

module.exports = {
    eventBus,
    eventBusTag,
};
