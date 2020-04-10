import { RequestData } from "../route-types/newFeatureStatusSet";
import { RpcHandlerReturn } from "../types";
import * as db from "../db";
import * as eventBus from "../eventBus";

/**
 * Flag the UI welcome flow as completed
 */
export default async function newFeatureStatusSet({
  featureId,
  status
}: RequestData): RpcHandlerReturn {
  db.newFeatureStatus.set(featureId, status);

  // Notify the UI of the uiWelcomeStatus change
  eventBus.requestSystemInfo.emit();

  return {
    message: "Changed uiWelcomeStatus"
  };
}
