import * as upnpc from "../../modules/upnpc";
import * as eventBus from "../../eventBus";
import params from "../../params";
import * as db from "../../db";
import getPortsToOpen from "./getPortsToOpen";
import getLocalIp from "../../utils/getLocalIp";
// Utils
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import { PackagePort } from "../../types";
import { logs } from "../../logs";

const natRenewalInterval =
  params.NAT_RENEWAL_WATCHER_INTERVAL || 60 * 60 * 1000;

const portId = (port: PackagePort): string =>
  `${port.portNumber} ${port.protocol}`;

let isFirstRunGlobal = true;
async function natRenewal(): Promise<void> {
  // Signal it's no longer the first run
  const isFirstRun = isFirstRunGlobal;
  isFirstRunGlobal = false;

  try {
    // 1. Get the list of ports and check there is a UPnP device
    // portMappings = [ {protocol: 'UDP', exPort: '500', inPort: '500'} ]
    try {
      const portMappings = await upnpc.list();
      db.upnpAvailable.set(true);
      if (isFirstRun) {
        logs.info(
          "UPnP device available. Current UPNP port mappings\n",
          portMappings
            .map(p => `${p.ip} ${p.exPort}:${p.inPort}/${p.protocol}`)
            .join("\n")
        );
      }
    } catch (e) {
      if (e.message.includes("NOUPNP")) {
        db.upnpAvailable.set(false);
        if (isFirstRun) logs.warn("No UPnP device available");
        return;
      } else {
        throw e;
      }
    }

    // Fetch portsToOpen and store them in the DB
    const portsToOpen = await getPortsToOpen();
    db.portsToOpen.set(portsToOpen);
    if (isFirstRun)
      logs.info(
        "NAT renewal portsToOpen\n",
        portsToOpen.map(p => `${p.portNumber}/${p.protocol}`).join(", ")
      );

    // Fetch the localIp only once for all the portsToOpen
    const localIp = await getLocalIp();

    // NOTE: Open every port regardless if it's already open

    // 2. Renew NAT mapping
    for (const portToOpen of portsToOpen) {
      // If it's the first run, close any existing mapping
      if (isFirstRun) {
        try {
          await upnpc.close(portToOpen);
        } catch (e) {
          // Errors while closing a port before openning do not matter.
          logs.debug(`Error closing port ${portId(portToOpen)}`, e);
        }
      }

      try {
        // Run first open, and every interval to refresh the mapping.
        await upnpc.open(portToOpen, localIp || "");
      } catch (e) {
        // Error stack of shell processes do not matter. The message contains all the info
        logs.error(`Error openning port ${portId(portToOpen)}: ${e.message}`);
      }
    }

    // 4. Verify that the ports have been opened
    if (portsToOpen.length) {
      const upnpPortMappings = await upnpc.list();
      db.upnpPortMappings.set(upnpPortMappings);
      for (const portToOpen of portsToOpen) {
        const currentPort = upnpPortMappings.find(
          p =>
            p.protocol === portToOpen.protocol &&
            p.exPort === String(portToOpen.portNumber) &&
            p.inPort === String(portToOpen.portNumber)
        );
        const portIsOpen = Boolean(currentPort);
        if (portIsOpen) {
          if (isFirstRun)
            logs.info(`Port ${portId(portToOpen)} successfully opened`);
        } else {
          logs.error(`Port ${portId(portToOpen)} is not open`);
        }
      }
    }
  } catch (e) {
    logs.error("Error on NAT renewal interval", e);
  }
}

/**
 * runOnlyOneSequentially makes sure that natRenewal is not run twice
 * in parallel. Also, if multiple requests to run natRenewal, they will
 * be ignored and run only once more after the previous natRenewal is
 * completed.
 */

const throttledNatRenewal = runOnlyOneSequentially(natRenewal);

/**
 * NAT renewal watcher.
 * Makes sure all necessary ports are mapped using UPNP
 */
export default function runWatcher(): void {
  throttledNatRenewal();
  setInterval(() => {
    throttledNatRenewal();
  }, natRenewalInterval);

  eventBus.runNatRenewal.on(() => {
    throttledNatRenewal();
  });
}
