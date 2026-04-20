import { useEffect } from "react";
import { useApi } from "api";
import { pauseFaro, unpauseFaro } from "../faro";

/**
 * Reactively pause/unpause Grafana Faro based on the user's
 * UI telemetry consent stored in the backend DB.
 * Call this hook once from a top-level authenticated component.
 */
export function useUiTelemetryConsent(): void {
  const consentRes = useApi.uiTelemetryConsentGet();

  useEffect(() => {
    if (consentRes.data === true) {
      unpauseFaro();
    } else {
      pauseFaro();
    }
  }, [consentRes.data]);
}
