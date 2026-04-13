import React, { useState } from "react";
import BottomButtons from "../BottomButtons";
import SwitchBig from "components/SwitchBig";
import { api } from "api";

export default function EnableUiTelemetry({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  const [telemetryOn, setTelemetryOn] = useState(true);

  function onSubmit() {
    api.uiTelemetryConsentSet({ enabled: telemetryOn }).catch((e) => {
      console.error(`Error on uiTelemetryConsentSet: ${e.message}`);
    });
    onNext();
  }

  return (
    <>
      <div className="header">
        <div className="title">Help improve DAppNode</div>
        <div className="description">
          <p>
            Enable anonymous telemetry to help us improve DAppNode. The data collected includes UI interactions, errors,
            and performance metrics.
          </p>
          <ul style={{ textAlign: "left", paddingLeft: "1.5rem" }}>
            <li>
              <strong>Improve DAppNode:</strong> Your usage data helps us understand how features are used and where
              issues occur, so we can build a better product.
            </li>
            <li>
              <strong>Privacy via Tor:</strong> All telemetry data is routed through Tor, so your public IP address is
              never shared with our servers.
            </li>
            <li>
              <strong>Better support:</strong> Logs and traces help the DAppNode team diagnose and resolve issues faster
              when you reach out for support.
            </li>
          </ul>
          <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            You can change this setting at any time in System &gt; Advanced.{" "}
            <a href="https://gdpr-info.eu/" target="_blank" rel="noopener noreferrer">
              Learn more about GDPR
            </a>
          </p>
        </div>
      </div>

      <div className="auto-updates-switch">
        <SwitchBig
          checked={telemetryOn}
          onChange={setTelemetryOn}
          label="Enable anonymous telemetry"
          id="enable-ui-telemetry"
        />
      </div>

      <BottomButtons onBack={onBack} onNext={onSubmit} />
    </>
  );
}
