import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";
import SwitchBig from "components/SwitchBig";
import { api } from "api";
import Input from "components/Input";

export default function EnableEthicalMetrics({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  const [ethicalMetricsOn, setEthicalMetricsOn] = useState(false);
  const [mail, setMail] = useState("");
  const [mailError, setMailError] = useState(false);

  // regex for email validation
  useEffect(() => {
    const regex = /\S+@\S+\.\S+/;
    if (regex.test(mail)) {
      setMailError(false);
      setEthicalMetricsOn(false);
    } else {
      setMailError(true);
      setEthicalMetricsOn(true);
    }
  }, [mail]);

  function onSetEnanleEthicalMetrics() {
    if (ethicalMetricsOn)
      api.enableEthicalMetrics({ mail, sync: false }).catch(e => {
        console.error(`Error on autoUpdateSettingsEdit : ${e.stack}`);
      });
    onNext();
  }

  return (
    <>
      <div className="header">
        <div className="title">Enable system notifications</div>
        <div className="description">
          Enable ethical metrics and receive alerts whenever your dappnode is
          down without losing your privacy
        </div>
      </div>

      <Input
        prepend="Email"
        value={mail}
        onValueChange={setMail}
        isInvalid={mailError}
        required={true}
        placeholder="example@email.com"
      />

      {/* This top div prevents the card from stretching vertically */}
      <div>
        <SwitchBig
          disabled={mailError}
          checked={ethicalMetricsOn}
          onChange={setEthicalMetricsOn}
          label="Enable system notifications"
          id="enable-ethical-metrics"
        />
      </div>

      <BottomButtons onBack={onBack} onNext={onSetEnanleEthicalMetrics} />
    </>
  );
}
