import * as db from "../db";
import { eventBus } from "../eventBus";
import { NewFeatureId, NewFeatureStatus } from "@dappnode/common";

/**
 * Flag the UI welcome flow as completed
 */
export async function newFeatureStatusSet({
  featureId,
  status
}: {
  featureId: NewFeatureId;
  status: NewFeatureStatus;
}): Promise<void> {
  db.newFeatureStatus.set(featureId, status);

  // Notify the UI of the uiWelcomeStatus change
  eventBus.requestSystemInfo.emit();
}
