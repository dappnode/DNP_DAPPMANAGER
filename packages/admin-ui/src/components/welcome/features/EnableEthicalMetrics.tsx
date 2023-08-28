import React, { useState } from "react";
import BottomButtons from "../BottomButtons";
import SwitchBig from "components/SwitchBig";
import { api } from "api";

export default function EnableEthicalMetrics({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  // By default, activate system ethical metrics if user doesn't change anything
  const [autoUpdateOn, setAutoUpdateOn] = useState(true);
  const [email, setEmail] = useState("");

  /**
   * The only change it will persist is turning all auto-update settings on
   * If the user does not toggle the switch, the settings will be left as they are
   * which might be partially on / off
   */
  function onSetEnanleEthicalMetrics() {
    if (autoUpdateOn)
      api.enable({ id, enabled: true }).catch(e => {
        console.error(`Error on autoUpdateSettingsEdit ${id}: ${e.stack}`);
      });
    onNext();
  }

  return (
    <>
      <div className="header">
        <div className="title">Enable notifications</div>
        <div className="description">
          Enable ethical metrics and receive alerts whenever your dappnode is
          down without loosing your privacy
        </div>
      </div>

      {/* This top div prevents the card from stretching vertically */}
      <div className="auto-updates-switch">
        <SwitchBig
          checked={autoUpdateOn}
          onChange={setAutoUpdateOn}
          label="Enable system auto-updates"
          id="auto-updates-switch"
        />
      </div>

      <BottomButtons onBack={onBack} onNext={onSetEnanleEthicalMetrics} />
    </>
  );
}
