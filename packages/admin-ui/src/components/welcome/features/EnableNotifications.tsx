import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";
import { docsUrl, externalUrlProps } from "params";

import SubTitle from "components/SubTitle";
import Switch from "components/Switch";
import { api, useApi } from "api";
import { notificationsDnpName } from "params.js";
import { withToast } from "components/toast/Toast";
import { continueIfCalleDisconnected } from "api/utils";

export default function EnableNotifications({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const [notificationsDisabled, setNotificationsDisabled] = useState<boolean>(false);

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
          <a href={docsUrl.notificationsOverview} {...externalUrlProps}>Dappnode's documentation</a>
        </p>
      </div>

      <BottomButtons onBack={onBack} onNext={() => onNext()} />
      <br />
      <br />
    </div>
  );
}
