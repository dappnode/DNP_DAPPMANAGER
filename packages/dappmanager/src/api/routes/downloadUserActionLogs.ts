import { logUserAction } from "@dappnode/logger";
import { wrapHandlerHtml } from "../utils.js";

/**
 * Endpoint to download user action logs.
 */
export const downloadUserActionLogs = wrapHandlerHtml(async (_, res) => {
  const logs = logUserAction.get();

  const filename = `dappnode-user-action-logs_${new Date().toISOString()}.json`;
  const mimetype = "application/json";
  res.setHeader("Content-disposition", "attachment; filename=" + filename);
  res.setHeader("Content-type", mimetype);

  res.status(200).send(JSON.stringify(logs, null, 2));
});
