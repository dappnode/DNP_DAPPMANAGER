const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const eventBus = new MyEmitter();

const eventBusTag = {
    logUI: 'EVENT_BUS_LOGUI',
    call: 'EVENT_BUS_CALL',
  };

module.exports = {
    eventBus,
    eventBusTag,
};
