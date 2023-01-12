import { AbortSignal } from "abort-controller";
import * as upnpc from "../../modules/upnpc";
import { eventBus } from "../../eventBus";
import params from "../../params";
import * as db from "../../db";
import getPortsToOpen from "./getPortsToOpen";
import getLocalIp from "../../utils/getLocalIp";
// Utils
import {
  runAtMostEveryIntervals,
  runOnlyOneSequentially
} from "../../utils/asyncFlows";
import { PackagePort } from "@dappnode/common";
import { logs } from "../../logs";
import { listContainers } from "../../modules/docker/list";

let isFirstRunGlobal = true;
async function natRenewal(): Promise<void> {
  if (params.DISABLE_UPNP) {
    return logs.debug("UPNP is disabled by flag");
  }

  if (db.isNatRenewalDisabled.get() === true) {
    return logs.debug("UPNP is disabled by user");
  }

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
    const containers = await listContainers();
    const portsToOpen = getPortsToOpen(containers);
    db.portsToOpen.set(portsToOpen);
    if (isFirstRun)
      logs.info(
        "NAT renewal portsToOpen\n",
        portsToOpen.map(p => `${p.portNumber}/${p.protocol}`).join(", ")
      );

    // Fetch the localIp only once for all the portsToOpen
    const localIp = await getLocalIp();
    if (localIp) db.internalIp.set(localIp);
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
 * Util to render ports in a consistent way
 */
function portId(port: PackagePort): string {
  return `${port.portNumber} ${port.protocol}`;
}

/**
 * runOnlyOneSequentially makes sure that natRenewal is not run twice
 * in parallel. Also, if multiple requests to run natRenewal, they will
 * be ignored and run only once more after the previous natRenewal is
 * completed.
 */
export const throttledNatRenewal = runOnlyOneSequentially(natRenewal);

/**
 * NAT renewal daemon.
 * Makes sure all necessary ports are mapped using UPNP
 */
export function startNatRenewalDaemon(signal: AbortSignal): void {
  // TEMPRARY: This solution will make to run an empty loop if false
  function runThrottledNatRenewalIfEnabled(): void {
    if (db.isNatRenewalDisabled.get() === true) return; // is disabled, skip
    throttledNatRenewal();
  }

  eventBus.runNatRenewal.on(() => {
    runThrottledNatRenewalIfEnabled();
  });

  runAtMostEveryIntervals(
    async () => runThrottledNatRenewalIfEnabled(),
    [
      // User may turn-on UPnP right after installing DAppNode.
      // So run this daemon 2 times a bit more frequently for that case.
      5 * 60 * 1000,
      15 * 60 * 1000,
      params.NAT_RENEWAL_DAEMON_INTERVAL
    ],
    signal
  );
}
