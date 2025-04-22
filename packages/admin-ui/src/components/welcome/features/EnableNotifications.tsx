import React, { useState } from "react";
import BottomButtons from "../BottomButtons";
import { docsUrl } from "params";

import SubTitle from "components/SubTitle";
import Switch from "components/Switch";

export default function EnableNotifications({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div>
      <div className="header">
        <div className="title">Enable Dappnode's Notifications</div>
        <br />
        <h4>📣 Heads up! Changes are coming to Notifications</h4>
        <p>
          The current notification system will be <b>deprecated</b> in upcoming Dappnode core releases.
        </p>
        <p>
          We're transitioning to a new and improved in-app Notifications experience, designed to be more reliable,
          configurable and scalable.
        </p>
        <SubTitle className="notifications-section-title">Enable new notifications</SubTitle>
        <Switch
          checked={notificationsEnabled}
          onToggle={() => {
            setNotificationsEnabled(!notificationsEnabled);
          }}
        />
        <br />
        <br />
        <p>
          Learn more about notifications package and how to configure it in the{" "}
          <a href={docsUrl.notificationsOverview}>Dappnode's documentation</a>
        </p>
      </div>

      <BottomButtons onBack={onBack} onNext={() => onNext()} />
      <br />
      <br />
    </div>
  );
}
