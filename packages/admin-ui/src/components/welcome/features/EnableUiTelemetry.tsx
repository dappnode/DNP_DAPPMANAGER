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
        <div className="title">Help improve Dappnode</div>
        <div className="description">
          <p>
            You can optionally enable telemetry to help us improve Dappnode.
            When enabled, we collect usage data such as UI interactions,
            performance metrics, and error reports.
          </p>

          <p>
            By enabling this option, you consent to the collection and processing of this telemetry data.
            You can disable telemetry at any time in System &gt; Advanced.
          </p>

          <details style={{ textAlign: "left", marginTop: "0.5rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 500 }}>What data is collected and why?</summary>

            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>
                <strong>Improve Dappnode:</strong> Your usage data helps us understand how features are used and where
                issues occur, so we can build a better product.
              </li>
              <li>
                <strong>Better support:</strong> Telemetry helps the Dappnode team diagnose and resolve issues faster
                when you reach out for support.
              </li>
            </ul>

            <p>
              This data includes your IP address and a pseudonymous persistent session identifier to understand usage over time.
              Telemetry is proxied through Dappnode infrastructure and processed using third-party services such as Grafana Cloud.
            </p>

            <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
              Learn more in our{" "}
              <a href="https://dappnode.com/pages/privacy-policy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              .
            </p>
          </details>
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
