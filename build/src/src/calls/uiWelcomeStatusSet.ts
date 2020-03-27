import { RequestData } from "../route-types/uiWelcomeStatusSet";
import { RpcHandlerReturn } from "../types";
import * as db from "../db";
import * as eventBus from "../eventBus";

/**
 * Flag the UI welcome flow as completed
 */
export default async function uiWelcomeStatusSet({
  uiWelcomeStatus
}: RequestData): RpcHandlerReturn {
  db.uiWelcomeStatus.set(uiWelcomeStatus);

  // Notify the UI of the uiWelcomeStatus change
  eventBus.requestSystemInfo.emit();

  return {
    message: "Changed uiWelcomeStatus"
  };
}
