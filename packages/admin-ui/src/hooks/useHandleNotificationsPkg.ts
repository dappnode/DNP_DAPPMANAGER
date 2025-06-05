import { api, useApi } from "api";
import { useCallback, useEffect, useState } from "react";
import { notificationsDnpName } from "params.js";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";
import { InstalledPackageDataApiReturn } from "@dappnode/types";
import { prettyDnpName } from "utils/format";

export function useHandleNotificationsPkg() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [notRunningServices, setNotRunningServices] = useState<string[]>([]);
  const [notificationsPkg, setNotificationsPkg] = useState<InstalledPackageDataApiReturn | undefined>(undefined);
  const [errorInstallingNotifications, setErrorInstallingNotifications] = useState<string | null>(null);

  const dnps = useApi.packagesGet();

  useEffect(() => {
    setIsLoading(dnps.isValidating);
  }, [dnps.isValidating]);

  useEffect(() => {
    if (dnps.data) {
      const notificationsPkg = dnps.data.find((dnp) => dnp.dnpName === notificationsDnpName);
      setIsInstalled(Boolean(notificationsPkg));
      setNotificationsPkg(notificationsPkg ?? undefined);

      if (notificationsPkg) {
        setNotRunningServices(
          notificationsPkg.containers.filter((c) => c.state !== "running").map((c) => c.serviceName)
        );
      } else {
        setNotRunningServices([]);
      }
    }
  }, [dnps.data]);

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

        dnps.revalidate();
      }
    } catch (e) {
      console.error(`Error on start/stop notifications package: ${e}`);
    }
  }, [isInstalled, notificationsPkg, notRunningServices, dnps]);

  const installNotificationsPkg = useCallback(async (): Promise<void> => {
    try {
      setIsInstalling(true);
      await withToast(
        continueIfCalleDisconnected(
          () =>
            api.packageInstall({
              name: notificationsDnpName,
              options: {
                BYPASS_CORE_RESTRICTION: true,
                BYPASS_SIGNED_RESTRICTION: true
              }
            }),
          notificationsDnpName
        ),
        {
          message: `Installing ${prettyDnpName(notificationsDnpName)}...`,
          onSuccess: `Installed ${prettyDnpName(notificationsDnpName)}`,
          onError: `Error while installing ${prettyDnpName(notificationsDnpName)}`
        }
      );

      setErrorInstallingNotifications(null);
    } catch (error) {
      console.error(`Error while installing notifications package: ${error}`);
      setErrorInstallingNotifications(`Error while installing notifications package: ${error}`);
    } finally {
      setIsInstalling(false);
      await dnps.revalidate();
    }
  }, [dnps]);

  return {
    isLoading,
    isInstalled,
    isRunning: isInstalled && notRunningServices.length === 0,
    startStopNotifications,
    installNotificationsPkg,
    isInstalling,
    errorInstallingNotifications
  };
}
