const upnpc = require("modules/upnpc");
const logs = require("logs.js")(module);
const db = require("db");
const getPortsToOpen = require("./getPortsToOpen");

const natRenewalInterval = 60 * 60 * 1000;

const portId = port => `${port.portNumber} ${port.protocol}`;

let isFirstRun = true;
async function natRenewal() {
  try {
    // 1. Get the list of ports and check there is a UPnP device
    // portMappings = [ {protocol: 'UDP', exPort: '500', inPort: '500'} ]
    try {
      const portMappings = await upnpc.list();
      await db.set("upnpAvailable", true);
      if (isFirstRun) {
        logs.info("UPnP device available");
        logs.info(
          `Current UPNP port mappings: ${JSON.stringify(portMappings, null, 2)}`
        );
      }
    } catch (e) {
      if (e.message.includes("NOUPNP")) {
        await db.set("upnpAvailable", false);
        if (isFirstRun) logs.warn("No UPnP device available");
        return;
      } else {
        throw e;
      }
    }

    // Fetch portsToOpen and store them in the DB
    const portsToOpen = await getPortsToOpen();
    await db.set("portsToOpen", portsToOpen);
    if (isFirstRun)
      logs.info(
        `NAT renewal portsToOpen: ${JSON.stringify(portsToOpen, null, 2)}`
      );

    // NOTE: Open the ports regardless if it is already open

    // 2. Renew NAT mapping
    for (const portToOpen of portsToOpen) {
      // If it's the first run, close any existing mapping
      if (isFirstRun) {
        try {
          await upnpc.close(portToOpen);
        } catch (e) {
          // Errors while closing a port before openning do not matter.
          logs.warn(
            `Not closing any existing mapping of port: ${portId(portToOpen)}`
          );
          logs.debug(`Error closing port ${portId(portToOpen)}: ${e.stack}`);
        }
        isFirstRun = false;
      }

      try {
        // Run first open, and every interval to refresh the mapping.
        await upnpc.open(portToOpen);
      } catch (e) {
        // Error stack of shell processes do not matter. The message contains all the info
        logs.error(`Error openning port ${portId(portToOpen)}: ${e.message}`);
      }
    }

    // 4. Verify that the ports have been opened
    if (portsToOpen.length) {
      const currentPortMappings = await upnpc.list();
      await db.set("currentPortMappings", currentPortMappings);
      for (const portToOpen of portsToOpen) {
        const currentPort = currentPortMappings.find(
          p =>
            p.protocol === portToOpen.protocol &&
            p.exPort === String(portToOpen.portNumber) &&
            p.inPort === String(portToOpen.portNumber)
        );
        if (currentPort) {
          logs.info(
            `Port ${portId(portToOpen)} verified. It is currently open`
          );
        } else {
          logs.error(`Error, port ${portId(portToOpen)} is not currently open`);
        }
      }
    }
  } catch (e) {
    logs.error(`Error on NAT renewal interval: ${e.stack}`);
  }
}

natRenewal();
setInterval(() => {
  natRenewal();
}, natRenewalInterval);

module.exports = natRenewal;
