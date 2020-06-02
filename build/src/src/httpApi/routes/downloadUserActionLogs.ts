import express from "express";
import params from "../../params";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * Endpoint to download user action logs.
 */
export const downloadUserActionLogs: express.Handler = async (req, res) => {
  return res.download(params.USER_ACTION_LOGS_DB_PATH, errHttp => {
    logs.info(`Error downloading user action logs: ${errHttp.message}`);
  });
};
