import React, { useState } from "react";
import BottomButtons from "../BottomButtons";
import SwitchBig from "components/SwitchBig";
import { api } from "api";
import { docsUrl, externalUrlProps } from "params";

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
            Help us improve Dappnode by enabling telemetry. We collect usage data, performance metrics, and error
            reports. You can disable this at any time in System &gt; Advanced.{" "}
            <a href={docsUrl.uiTelemetry} {...externalUrlProps}>
              Learn more
            </a>
            {" · "}
            <a href="https://dappnode.com/pages/privacy-policy" {...externalUrlProps}>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      <div className="auto-updates-switch">
        <SwitchBig checked={telemetryOn} onChange={setTelemetryOn} label="Enable telemetry" id="enable-ui-telemetry" />
      </div>

      <BottomButtons onBack={onBack} onNext={onSubmit} />
    </>
  );
}
