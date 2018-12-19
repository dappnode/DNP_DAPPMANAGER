const {eventBus, eventBusTag} = require('eventBus');
// const logs = require('logs.js')(module);

const shouldOpenPorts = () => new Promise((resolve, reject) => {
    eventBus.emit(eventBusTag.call, {
        event: 'statusUPnP.vpn.dnp.dappnode.eth',
        callback: (res) => {
            if (res.success) {
                resolve(res.result.openPorts && res.result.upnpAvailable);
            } else {
                // For now, in case of error log it and return that ports should not be openned
                // logs('Error fetching UPnP status: ' + res.message);
                // resolve(false);
                reject(Error('Error fetching UPnP status: ' + res.message));
            }
        },
    });
});

module.exports = shouldOpenPorts;

