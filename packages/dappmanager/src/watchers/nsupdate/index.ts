import retry from "async-retry";
import * as eventBus from "../../eventBus";
import * as db from "../../db";
import params from "../../params";
import execNsupdate from "./execNsupdate";
import { listContainers } from "../../modules/docker/list";
import { setIntervalDynamic } from "../../utils/asyncFlows";
// Utils
import { getNsupdateTxts } from "./utils";
import { logs } from "../../logs";

const nsupdateInterval = params.NSUPDATE_WATCHER_INTERVAL || 60 * 60 * 1000;
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

  eventBus.packagesModified.on(({ dnpNames, removed }) => {
    // When the BIND is re-created, run nsupdate on all domains. Wait 5s to be active
    if (dnpNames.includes(params.bindDnpName))
      setTimeout(() => runNsupdate({}), 5000);
    // React immediatelly to new installs
    else if (removed) runNsupdate({ dnpNames, removeOnly: true });
    else runNsupdate({ dnpNames });
  });
}
