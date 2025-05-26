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

export default function EnableNotifications({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const [notificationsDisabled, setNotificationsDisabled] = useState<boolean>(false);
  const [notificationsNotInstalled, setNotificationsNotInstalled] = useState<boolean>(false);
  const [isNotificationsInstalling, setIsNotificationsInstalling] = useState<boolean>(false);

  const dnps = useApi.packagesGet();
  useEffect(() => {
    if (dnps.data) {
      setNotificationsNotInstalled(dnps.data.find((dnp) => dnp.dnpName === notificationsDnpName) === undefined);
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
                // TODO: Delete the version once the package notifications package is releasedsxº
                version: "/ipfs/QmUMZfGt15CE8yifCAbeUybm75qUxAe1SucnqsbGjGEiKn",
                options: {
                  BYPASS_SIGNED_RESTRICTION: true
                }
              }),
            notificationsDnpName
          ),
          {
            message: `Installing ${prettyDnpName(notificationsDnpName)}...`,
            onSuccess: `Installed ${prettyDnpName(notificationsDnpName)}`
          }
        );
      } catch (error) {
        console.error(`Error while installing notifications package: ${error}`);
        setIsNotificationsInstalling(false);
        return;
      } finally {
        setIsNotificationsInstalling(false);
        notificationsDnp.revalidate();
      }
    }

    if (notificationsNotInstalled) {
      installNotificationsPkg();
    }
  }, [notificationsNotInstalled]);

  const notificationsDnp = useApi.packageGet({ dnpName: notificationsDnpName });
  useEffect(() => {
    if (notificationsDnp.data) {
      const isStopped = notificationsDnp.data.containers.some((c) => c.state !== "running");
      setNotificationsDisabled(isStopped);
    }
  }, [notificationsDnp.data]);

  async function startStopNotifications(): Promise<void> {
    try {
      if (notificationsDnp.data) {
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

        notificationsDnp.revalidate();
      }
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
        {notificationsNotInstalled ? (
          isNotificationsInstalling ? (
            <Loading steps={["Installing notifications package"]} />
          ) : (
            notificationsDnp.error && <SubTitle>Error while installing notifications package</SubTitle>
          )
        ) : (
          <>
            <SubTitle>Enable new notifications</SubTitle>
            <Switch
              checked={!notificationsDisabled}
              disabled={notificationsDnp.isValidating}
              onToggle={() => {
                startStopNotifications();
              }}
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
