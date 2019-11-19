import * as eventBus from "../../eventBus";
import params from "../../params";
import execNsupdate from "./execNsupdate";
import { listContainers } from "../../modules/docker/listContainers";
// Utils
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import { getNsupdateTxts } from "./utils";
import Logs from "../../logs";
const logs = Logs(module);

const nsupdateInterval = params.NSUPDATE_WATCHER_INTERVAL || 60 * 60 * 1000;

async function runNsupdate() {
  try {
    const dnpList = await listContainers();
    const nsupdateTxts = getNsupdateTxts(dnpList);
    for (const nsupdateTxt of nsupdateTxts) {
      await execNsupdate(nsupdateTxt);
    }
  } catch (e) {
    logs.error(`Error on nsupdate interval: ${e.stack}`);
  }
}

/**
 * runOnlyOneSequentially makes sure that nsupdate is not run twice
 * in parallel. Also, if multiple requests to run nsupdate, they will
 * be ignored and run only once more after the previous nsupdate is
 * completed.
 */

const throttledNsupdate = runOnlyOneSequentially(runNsupdate);

// First call
throttledNsupdate();

// Every interval
setInterval(() => {
  throttledNsupdate();
}, nsupdateInterval);

// React immediatelly to new installs
eventBus.packageModified.on(() => {
  throttledNsupdate();
});

export default throttledNsupdate;
