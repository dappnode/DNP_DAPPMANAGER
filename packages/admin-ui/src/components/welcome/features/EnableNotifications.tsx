import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";
import { docsUrl, externalUrlProps } from "params";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import { api, useApi } from "api";
import { notificationsDnpName } from "params.js";
import { withToast } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";
import Loading from "components/Loading";
import { prettyDnpName } from "utils/format";
import ErrorBoundary from "components/ErrorBoundary";

export default function EnableNotifications({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const [notificationsDisabled, setNotificationsDisabled] = useState<boolean>(false);
  const [notificationsNotInstalled, setNotificationsNotInstalled] = useState<boolean>(false);
  const [isNotificationsInstalling, setIsNotificationsInstalling] = useState<boolean>(false);
  const [errorInstallingNotifications, setErrorInstallingNotifications] = useState<string | null>(null);

  const dnps = useApi.packagesGet();

  useEffect(() => {
    if (dnps.data) {
      setNotificationsNotInstalled(dnps.data.find((dnp) => dnp.dnpName === notificationsDnpName) === undefined);
      // update notifications package state
      const notificationsPkg = dnps.data.find((dnp) => dnp.dnpName === notificationsDnpName);
      if (notificationsPkg) {
        const isStopped = notificationsPkg.containers.some((c) => c.state !== "running");
        setNotificationsDisabled(isStopped);
      } else {
        setNotificationsDisabled(true);
      }
    }
  }, [dnps.data]);

  useEffect(() => {
    async function installNotificationsPkg() {
      try {
        setIsNotificationsInstalling(true);
        await withToast(
          continueIfCalleDisconnected(
            () =>
              api.packageInstall({
                name: notificationsDnpName,
                version: "/ipfs/QmZfC3Nux86aodbuqEGLQZeVizudVa6PxdeGKvWBWPCmUC",
                options: {
                  BYPASS_CORE_RESTRICTION: true, // allow installation even if the core version is not compatible
                  BYPASS_SIGNED_RESTRICTION: true // allow installation even if the package is not signed
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
        setNotificationsNotInstalled(false);
      } catch (error) {
        console.error(`Error while installing notifications package: ${error}`);
        setErrorInstallingNotifications(`Error while installing notifications package: ${error}`);
        return;
      } finally {
        setIsNotificationsInstalling(false);
        await dnps.revalidate();
      }
    }

    if (notificationsNotInstalled) installNotificationsPkg();
  }, [notificationsNotInstalled]);

  async function startStopNotifications(): Promise<void> {
    try {
      await withToast(
        continueIfCalleDisconnected(
          () => api.packageStartStop({ dnpName: notificationsDnpName }),
          notificationsDnpName
        ),
        {
          message: notificationsDisabled ? "Enabling notifications" : "Disabling notifications",
          onSuccess: notificationsDisabled ? "Notifications Enabled" : "Notifications disabled"
        }
      );

      await dnps.revalidate();
    } catch (e) {
      console.error(`Error on start/stop notifications package: ${e}`);
    }
  }

  return (
    <div>
      <div className="header">
        <div className="title">Enable Dappnode's Notifications</div>
        <br />
        <h4>📣 Heads up! Changes are coming to Notifications</h4>
        <div>
          The current notification system will be <b>deprecated</b> in upcoming Dappnode core releases.
          <br />
          We're transitioning to a new and improved in-app Notifications experience, designed to be more reliable,
          configurable and scalable.
        </div>
        {dnps.isValidating || isNotificationsInstalling ? (
          <Loading steps={["Installing notifications package"]} />
        ) : notificationsNotInstalled ? (
          errorInstallingNotifications ? (
            <ErrorBoundary> {errorInstallingNotifications} </ErrorBoundary>
          ) : (
            <>Could not install {prettyDnpName(notificationsDnpName)}. A manual installation may be required.</>
          )
        ) : (
          <>
            <SubTitle>Enable new notifications</SubTitle>
            <Switch
              checked={!notificationsDisabled}
              disabled={dnps.isValidating}
              onToggle={() => startStopNotifications()}
            />
            <br />
            <br />
            <p>
              This notifications may alert you to critical issues if they arise. Disabling them could result in missing
              critical notifications
            </p>
            <p>
              Learn more about notifications package and how to configure it in the{" "}
              <a href={docsUrl.notificationsOverview} {...externalUrlProps}>
                Dappnode's documentation
              </a>
            </p>
          </>
        )}
      </div>

      <BottomButtons onBack={onBack} onNext={() => onNext()} nextDisabled={isNotificationsInstalling} />
      <br />
      <br />
    </div>
  );
}
