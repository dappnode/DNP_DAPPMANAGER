const {eventBus, eventBusTag} = require('eventBus');

function logUI(data) {
    eventBus.emit(eventBusTag.logUI, data);
    // Sent to index through events
    // Then forward through crossbar
}

module.exports = logUI;
