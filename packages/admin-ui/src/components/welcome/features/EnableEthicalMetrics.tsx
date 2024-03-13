import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";
import SwitchBig from "components/SwitchBig";
import { api } from "api";
import Input from "components/Input";
import { docsUrl } from "params";

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

  const [telegramId, setTelegramId] = useState("");
  const [telegramIdError, setTelegramIdError] = useState(false);

  // regex for Telegram Channel ID validation
  useEffect(() => {
    const regex = /^-100\d+$/; // Start with -100 followed by digits
    if (regex.test(telegramId)) {
      setTelegramIdError(false);
      setEthicalMetricsOn(true); // Enable system notifications if Telegram ID is valid
    } else {
      setTelegramIdError(true); // Show error if Telegram ID is invalid
      setEthicalMetricsOn(false); // Disable system notifications if Telegram ID is invalid
    }
  }, [telegramId]);

  // regex for email validation
  useEffect(() => {
    const regex = /\S+@\S+\.\S+/;
    if (regex.test(mail)) {
      setMailError(false);
      setEthicalMetricsOn(true);
    } else {
      setMailError(true);
      setEthicalMetricsOn(false);
    }
  }, [mail]);

  function onSetEnabeEthicalMetrics() {
    if (ethicalMetricsOn)
      api
        .enableEthicalMetrics({ mail, tgChannelId: null, sync: false })
        .catch(e => {
          console.error(`Error on autoUpdateSettingsEdit : ${e.stack}`);
        });
    onNext();
  }

  return (
    <div className="ethical-container">
      <div className="header">
        <div className="title">Enable System Notifications</div>
        <div className="description">
          Enable ethical metrics and receive alerts whenever your dappnode is
          down without losing your privacy.{" "}
          <a href={docsUrl.ethicalMetricsOverview}>Learn more</a>
        </div>
      </div>

      <p className="instructions">
        <p className="instructions">
          <strong>Telegram notifications are available!</strong> Enter your <strong>Telegram Channel ID</strong> to receive reliable alerts promptly. If you don't have one, you can <a href="https://telegram.org/" target="_blank">create one now!</a> We highly recommend using the Telegram channel option (or both) rather than relying only on email notifications. Email notifications may be categorized as spam, potentially causing you to miss important notifications!
        </p>
        <p className="additional-info">
          You can edit these settings later in <strong>System</strong> &rarr; <strong>Notifications</strong>.
        </p>
      </p>

      <Input
        prepend="Telegram"
        value={telegramId}
        onValueChange={setTelegramId}
        isInvalid={telegramIdError}
        required={true}
        placeholder="Your Telegram Channel ID"
      />

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
          disabled={!telegramId && mailError && !ethicalMetricsOn}
          checked={ethicalMetricsOn}
          onChange={setEthicalMetricsOn}
          label="Enable system notifications"
          id="enable-ethical-metrics"
        />
      </div>

      <BottomButtons onBack={onBack} onNext={onSetEnabeEthicalMetrics} />
    </div>
  );
}
