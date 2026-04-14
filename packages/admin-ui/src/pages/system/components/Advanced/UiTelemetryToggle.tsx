import React from "react";
import { api, useApi } from "api";
import { withToast } from "components/toast/Toast";
import Switch from "components/Switch";
import "./uiTelemetryToggle.scss";

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
    <div className="ui-telemetry-wrapper">
      <div>
        Send anonymous usage data, errors, and performance metrics to help improve Dappnode and allow the team to better
        support you if you run into any issue. All telemetry is routed through Tor so your public IP is never shared.
      </div>
      <Switch
        checked={enabled}
        onToggle={handleToggle}
        id="ui-telemetry-toggle"
        disabled={!consentRes.data && consentRes.data !== false}
      />
    </div>
  );
}
