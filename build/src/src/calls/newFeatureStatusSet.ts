import { RequestData } from "../route-types/newFeatureStatusSet";
import * as db from "../db";
import * as eventBus from "../eventBus";

/**
 * Flag the UI welcome flow as completed
 */
export async function newFeatureStatusSet({
  featureId,
  status
}: RequestData): Promise<void> {
  db.newFeatureStatus.set(featureId, status);

  // Notify the UI of the uiWelcomeStatus change
  eventBus.requestSystemInfo.emit();
}
