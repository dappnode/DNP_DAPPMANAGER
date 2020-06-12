import React from "react";
import { isEmpty } from "lodash";
import { shortNameCapitalized } from "utils/format";
// Components
import ProgressBar from "react-bootstrap/ProgressBar";
import Card from "components/Card";
import { stringIncludes } from "utils/strings";
import { ProgressLogs } from "types";

/**
 * Return string before the first "%" and after the last " "
 * @param {string} s = "Downloading 65%"
 * @returns {string} percent
 */
function parsePercent(s: string) {
  return ((s || "").match(/\s(\d+?)%/) || [])[1];
}

/**
 * progressLogs = {
 *   "dnpName1.dnp.dappnode.eth": "Downloading 64%",
 *   "dnpName2.dnp.dappnode.eth": "Loading...",
 * }
 */
export function ProgressLogsView({
  progressLogs
}: {
  progressLogs: ProgressLogs | undefined;
}) {
  if (!progressLogs || isEmpty(progressLogs)) return null;

  return (
    <Card>
      {Object.entries(progressLogs)
        // Don't show "core.dnp.dappnode.eth" actual progress log information
        .filter(([dnpName]) => dnpName !== "core.dnp.dappnode.eth")
        .map(([dnpName, log = ""]) => {
          const percent = parsePercent(log);
          const progressing = Boolean(percent) || stringIncludes(log, "...");
          return (
            <div key={dnpName} className="row">
              <div className="col-6 text-truncate">
                <span>{shortNameCapitalized(dnpName)}</span>
              </div>
              <div className="col-6 text-truncate center">
                <ProgressBar
                  now={percent ? parseInt(percent) : 100}
                  animated={progressing}
                  label={log}
                  variant={progressing ? undefined : "success"}
                />
              </div>
            </div>
          );
        })}
    </Card>
  );
}
