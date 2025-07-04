import React, { useEffect } from "react";
import BottomButtons from "../BottomButtons";
import { docsUrl, externalUrlProps } from "params";
import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import { notificationsDnpName } from "params.js";
import Loading from "components/Loading";
import { prettyDnpName } from "utils/format";
import ErrorBoundary from "components/ErrorBoundary";
import { useHandleNotificationsPkg } from "hooks/useHandleNotificationsPkg";

export default function EnableNotifications({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const {
    isLoading,
    isInstalled,
    isRunning,
    startStopNotifications,
    installNotificationsPkg,
    isInstalling,
    errorInstallingNotifications
  } = useHandleNotificationsPkg();

  useEffect(() => {
    if (!isLoading && !isInstalled && !errorInstallingNotifications) installNotificationsPkg();
  }, [isLoading, isInstalled, errorInstallingNotifications]);

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
        {isLoading ? (
          <Loading steps={["Loading"]} />
        ) : isInstalling ? (
          <Loading steps={["Installing notifications package"]} />
        ) : !isInstalled ? (
          errorInstallingNotifications ? (
            <>
              <br />
              <ErrorBoundary> {errorInstallingNotifications} </ErrorBoundary>
            </>
          ) : (
            <>
              <br />
              Could not install {prettyDnpName(notificationsDnpName)}. A manual installation may be required.
            </>
          )
        ) : (
          <>
            <SubTitle>Enable new notifications</SubTitle>
            <Switch checked={isRunning} disabled={isLoading} onToggle={() => startStopNotifications()} />
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

      <BottomButtons onBack={onBack} onNext={() => onNext()} nextDisabled={isInstalling} backDisabled={isInstalling} />
      <br />
      <br />
    </div>
  );
}
