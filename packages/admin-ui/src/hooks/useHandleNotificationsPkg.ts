import { api, useApi } from "api";
import { useCallback, useEffect, useState } from "react";
import { notificationsDnpName } from "params.js";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";
import { InstalledPackageData } from "@dappnode/types";

export function useHandleNotificationsPkg() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [notRunningServices, setNotRunningServices] = useState<string[]>([]);
  const [notificationsPkg, setNotificationsPkg] = useState<InstalledPackageData | null>(null);

  const notificationsStatusRequest = useApi.notificationsPackageStatus();

  useEffect(() => {
    setIsLoading(notificationsStatusRequest.isValidating);
  }, [notificationsStatusRequest.isValidating]);

  useEffect(() => {
    if (notificationsStatusRequest.data) {
      const { notificationsDnp, isInstalled, isRunning, servicesNotRunning } = notificationsStatusRequest.data;
      setIsInstalled(isInstalled);
      setNotRunningServices(servicesNotRunning);
      setIsRunning(isRunning);
      setNotificationsPkg(notificationsDnp);
    }
  }, [notificationsStatusRequest.data]);

  const startStopNotifications = useCallback(async (): Promise<void> => {
    try {
      if (isInstalled && notificationsPkg) {
        const notificationsRunning = notRunningServices.length === 0;

        if (notificationsRunning) {
          await new Promise<void>((resolve) => {
            confirm({
              title: `Pause notifications package`,
              text: `Attention, the notifications package may alert you to critical issues if they arise. Pausing this package could result in missing important notifications.`,
              label: "Pause",
              onClick: resolve
            });
          });
        }

        await withToast(
          continueIfCalleDisconnected(
            () =>
              api.packageStartStop({
                dnpName: notificationsDnpName,
                serviceNames: notificationsRunning
                  ? notificationsPkg.containers.map((c) => c.serviceName)
                  : notRunningServices
              }),
            notificationsDnpName
          ),
          {
            message: notificationsRunning ? "Disabling notifications" : "Enabling notifications",
            onSuccess: notificationsRunning ? "Notifications disabled" : "Notifications Enabled"
          }
        );

        notificationsStatusRequest.revalidate();
      }
    } catch (e) {
      console.error(`Error on start/stop notifications package: ${e}`);
    }
  }, [isInstalled, notificationsPkg, notRunningServices, notificationsStatusRequest]);

  return {
    isLoading,
    isRunning,
    startStopNotifications
  };
}
