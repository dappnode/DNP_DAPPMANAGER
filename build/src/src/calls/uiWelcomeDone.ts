import { RpcHandlerReturn } from "../types";
import * as db from "../db";
import * as eventBus from "../eventBus";

/**
 * Flag the UI welcome flow as completed
 */
export default async function uiWelcomeDone({
  isDone
}: {
  isDone?: boolean;
}): RpcHandlerReturn {
  if (typeof isDone === "boolean") {
    db.uiWelcomeDone.set(isDone);
  } else {
    db.uiWelcomeDone.set(true);
  }

  // Notify the UI of the uiWelcomeDone change
  eventBus.requestSystemInfo.emit();

  return {
    message: "Flagged UI welcome flow"
  };
}

module.exports = uiWelcomeDone;
