import retry from "async-retry";
import { eventBus } from "@dappnode/eventbus";
import * as db from "../../db/index.js";
import { params } from "@dappnode/params";
import { listContainers } from "../../modules/docker/list/index.js";
import { getNsupdateTxts, execNsupdate } from "../../modules/nsupdate/index.js";
import { runAtMostEveryIntervals } from "../../utils/asyncFlows.js";
import { logs } from "@dappnode/logger";

const nsupdateInterval = params.NSUPDATE_DAEMON_INTERVAL || 60 * 60 * 1000;
let firstRun = true;

async function runNsupdate({
  dnpNames,
  removeOnly
}: {
  dnpNames?: string[];
  removeOnly?: boolean;
}): Promise<void> {
  try {
    const containers = await listContainers();

    // Load domain alias from db
    const domainAliases = {
      fullnode: db.fullnodeDomainTarget.get()
    };

    const nsupdateTxts = getNsupdateTxts({
      containers,
      domainAliases,
      dnpNames,
      removeOnly
    });

    for (const nsupdateTxt of nsupdateTxts)
      await retry(() => execNsupdate(nsupdateTxt));

    if (dnpNames) {
      if (removeOnly) logs.info("nsupdate delete", dnpNames);
      else logs.info("nsupdate add", dnpNames);
    } else if (firstRun) {
      logs.info(`Successful initial nsupdate call for all DNPs`);
      firstRun = false;
    }
  } catch (e) {
    logs.error("Error on nsupdate interval", e);
  }
}

/**
 * nsupdate daemon.
 * Makes sure all package domains are mapped to their current IP
 */
export function startNsUpdateDaemon(signal: AbortSignal): void {
  eventBus.packagesModified.on(({ dnpNames, removed }) => {
    if (dnpNames.includes(params.bindDnpName)) {
      // When the BIND is re-created, run nsupdate on all domains. Wait 5s to be active
      setTimeout(() => runNsupdate({}), 5000);
    } else {
      // React immediatelly to new installs
      if (removed) runNsupdate({ dnpNames, removeOnly: true });
      else runNsupdate({ dnpNames });
    }
  });

  // Every interval
  runAtMostEveryIntervals(
    async () => runNsupdate({}),
    [
      // There may be a race condition between the DAPPMANAGER and the BIND
      // On an update, if the DAPPMANAGER restarts first and then the BIND,
      // there might be a potential window of `nsupdateInterval` hasn't applied
      // the dynamic nsupdates provided by the DAPPMANAGER
      // Since doing an nsupdate is cheap this increase in refresh frequency
      // after a restart wants to prevents a potential issue by the race condition
      1 * 60 * 1000, //        1  min
      5 * 60 * 1000, //        5  min
      nsupdateInterval / 4, // 15 min
      nsupdateInterval / 2, // 30 min
      nsupdateInterval //      60 min
    ],
    signal
  );
}
