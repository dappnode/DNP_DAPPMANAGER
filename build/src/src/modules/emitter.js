const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const emitter = new MyEmitter();

emitter.setMaxListeners(100);

module.exports = emitter;
