import { store } from "../store";
// Actions to push received content
import { pushNotification } from "services/notifications/actions";
import {
  clearIsInstallingLog,
  updateIsInstallingLog
} from "services/isInstallingLogs/actions";
import { updateVolumes, setSystemInfo } from "services/dappnodeStatus/actions";
import { setDnpInstalled } from "services/dnpInstalled/actions";
import { updateDnpDirectory } from "services/dnpDirectory/actions";
import { updateDnpRegistry } from "services/dnpRegistry/actions";
import { Subscriptions } from "@dappnode/common";

export function mapSubscriptionsToRedux(subscriptions: Subscriptions): void {
  subscriptions.directory.on(directoryDnps => {
    store.dispatch(updateDnpDirectory(directoryDnps));
  });

  subscriptions.registry.on(registryDnps => {
    store.dispatch(updateDnpRegistry(registryDnps));
  });

  subscriptions.packages.on(dnpsInstalled => {
    store.dispatch(setDnpInstalled(dnpsInstalled));
  });

  subscriptions.progressLog.on(progressLog => {
    const { id, dnpName, message: log, clear } = progressLog;
    if (clear) store.dispatch(clearIsInstallingLog({ id }));
    else store.dispatch(updateIsInstallingLog({ id, dnpName, log }));
  });

  subscriptions.pushNotification.on(notification => {
    store.dispatch(pushNotification(notification));
  });

  subscriptions.systemInfo.on(systemInfo => {
    store.dispatch(setSystemInfo(systemInfo));
  });

  subscriptions.volumes.on(volumes => {
    store.dispatch(updateVolumes(volumes));
  });

  // The DAPPMANAGER may ask the UI to reload
  subscriptions.reloadClient.on(data => {
    /* eslint-disable-next-line no-console */
    console.log(`DAPPMANAGER triggered a client reload`, data);
    // If we needed to pull the document from the web-server again (such as where
    // the document contents change dynamically) we would pass the argument as 'true'.
    window.location.reload();
  });
}
