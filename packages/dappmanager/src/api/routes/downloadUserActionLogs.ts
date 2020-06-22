import express from "express";
import * as logUserAction from "../../logUserAction";

/**
 * Endpoint to download user action logs.
 */
export const downloadUserActionLogs: express.Handler = async (req, res) => {
  const logs = logUserAction.get();

  const filename = `dappnode-user-action-logs_${new Date().toISOString()}.json`;
  const mimetype = "application/json";
  res.setHeader("Content-disposition", "attachment; filename=" + filename);
  res.setHeader("Content-type", mimetype);

  res.status(200).send(JSON.stringify(logs, null, 2));
};
