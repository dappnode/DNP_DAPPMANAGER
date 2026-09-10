import * as db from "@dappnode/db";

export async function uiTelemetryConsentGet(): Promise<boolean> {
  return db.uiTelemetryConsent.get();
}

export async function uiTelemetryConsentSet({ enabled }: { enabled: boolean }): Promise<void> {
  db.uiTelemetryConsent.set(enabled);
}
