import * as eventBus from "../../eventBus";
import * as db from "../../db";
import params from "../../params";
import execNsupdate from "./execNsupdate";
import { listContainers } from "../../modules/docker/listContainers";
import { setIntervalDynamic, runWithRetry } from "../../utils/asyncFlows";
// Utils
import { getNsupdateTxts } from "./utils";
import Logs from "../../logs";
const logs = Logs(module);

const execNsupdateRetry = runWithRetry(execNsupdate, { base: 1000 });
const nsupdateInterval = params.NSUPDATE_WATCHER_INTERVAL || 60 * 60 * 1000;
let firstRun = true;

async function runNsupdate({
  ids,
  removeOnly
}: {
  ids?: string[];
  removeOnly?: boolean;
}): Promise<void> {
  try {
    const dnpList = await listContainers();

    // Load domain alias from db
    const domainAliases = {
      fullnode: db.fullnodeDomainTarget.get()
    };

    const nsupdateTxts = getNsupdateTxts({
      dnpList,
      domainAliases,
      ids,
      removeOnly
    });

    for (const nsupdateTxt of nsupdateTxts) {
      await execNsupdateRetry(nsupdateTxt);
    }

    if (ids) {
      if (removeOnly) logs.info(`nsupdate delete for ${ids.join(", ")}`);
      else logs.info(`nsupdate add for ${ids.join(", ")}`);
    } else if (firstRun) {
      logs.info(`Successful initial nsupdate call for all DNPs`);
      firstRun = false;
    }
  } catch (e) {
    logs.error(`Error on nsupdate interval: ${e.stack}`);
  }
}

/**
 * nsupdate watcher.
 * Makes sure all package domains are mapped to their current IP
 */
export default function runWatcher(): void {
  // First call
  runNsupdate({});

  // Every interval
  setIntervalDynamic(() => {
    runNsupdate({});
  }, [
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
  ]);

  eventBus.packagesModified.on(({ ids, removed }) => {
    // When the BIND is re-created, run nsupdate on all domains. Wait 5s to be active
    if (ids.includes(params.bindDnpName))
      setTimeout(() => runNsupdate({}), 5000);
    // React immediatelly to new installs
    else if (removed) runNsupdate({ ids, removeOnly: true });
    else runNsupdate({ ids });
  });
}
