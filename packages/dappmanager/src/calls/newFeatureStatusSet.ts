import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { NewFeatureId, NewFeatureStatus } from "@dappnode/types";

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
