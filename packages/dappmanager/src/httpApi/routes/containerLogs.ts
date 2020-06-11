import express from "express";
import * as calls from "../../calls";

/**
 * Endpoint to download all logs of a container as a file
 * Necessary to download large log files
 */
export const containerLogs: express.Handler = async (req, res) => {
  const { id } = req.params;
  const logs = await calls.logPackage({ id });

  const filename = `logs-dappnode-package-${id}.txt`;
  const mimetype = "text/plain";
  res.setHeader("Content-disposition", "attachment; filename=" + filename);
  res.setHeader("Content-type", mimetype);

  res.status(200).send(logs);
};
