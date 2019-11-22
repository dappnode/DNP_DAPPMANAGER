import * as eventBus from "../../eventBus";
import params from "../../params";
import execNsupdate from "./execNsupdate";
import { listContainers } from "../../modules/docker/listContainers";
// Utils
import { getNsupdateTxts } from "./utils";
import Logs from "../../logs";
const logs = Logs(module);

const nsupdateInterval = params.NSUPDATE_WATCHER_INTERVAL || 60 * 60 * 1000;
let firstRun = true;

async function runNsupdate({
  ids,
  removeOnly
}: {
  ids?: string[];
  removeOnly?: boolean;
}) {
  try {
    const dnpList = await listContainers();
    const nsupdateTxts = getNsupdateTxts({ dnpList, ids, removeOnly });
    for (const nsupdateTxt of nsupdateTxts) {
      await execNsupdate(nsupdateTxt);
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

// First call
runNsupdate({});

// Every interval
setInterval(() => {
  runNsupdate({});
}, nsupdateInterval);

// React immediatelly to new installs
eventBus.packagesModified.on(({ ids, removed }) => {
  if (removed) runNsupdate({ ids, removeOnly: true });
  else runNsupdate({ ids });
});

export {};
