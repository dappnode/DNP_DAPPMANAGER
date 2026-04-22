import React from "react";
import { api, useApi } from "api";
import { withToast } from "components/toast/Toast";
import Switch from "components/Switch";
import { docsUrl, externalUrlProps } from "params";
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
        Send usage data, errors, and performance metrics to help improve Dappnode and allow the team to better support
        you if you run into any issue.{" "}
        <a href={docsUrl.uiTelemetry} {...externalUrlProps}>
          Learn more
        </a>
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
