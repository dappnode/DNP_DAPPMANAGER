import React from "react";
import { api, useApi } from "api";
import { withToast } from "components/toast/Toast";
import SwitchBig from "components/SwitchBig";

export function UiTelemetryToggle() {
  const consentRes = useApi.uiTelemetryConsentGet();
  const enabled = consentRes.data ?? false;

  async function handleToggle(newValue: boolean) {
    await withToast(() => api.uiTelemetryConsentSet({ enabled: newValue }), {
      message: newValue ? "Enabling UI telemetry..." : "Disabling UI telemetry...",
      onSuccess: newValue ? "UI telemetry enabled" : "UI telemetry disabled"
    });
    await consentRes.revalidate();
  }

  return (
    <div>
      <p>
        Send anonymous usage data, errors, and performance metrics to help improve DAppNode. All telemetry is routed
        through Tor so your public IP is never shared.
      </p>
      <SwitchBig
        checked={enabled}
        onChange={handleToggle}
        label="Enable anonymous telemetry"
        id="ui-telemetry-toggle"
        disabled={!consentRes.data && consentRes.data !== false}
      />
    </div>
  );
}
