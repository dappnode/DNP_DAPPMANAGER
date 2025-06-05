import React from "react";
import BaseDropdown from "./BaseDropdown";
import { FiDownload } from "react-icons/fi";
import { ProgressLogs, ProgressLogsByDnp } from "types";
import { ProgressLogsView } from "pages/installer/components/InstallCardComponents/ProgressLogsView";

export default function InstallerDropdown({ installLogs }: { installLogs: ProgressLogsByDnp }) {
  const progressCardLogs: ProgressLogs[] = [];

  for (const key in installLogs) {
    progressCardLogs.push({
      [key]: installLogs[key][key].toString()
    });
  }

  return (
    <BaseDropdown
      name="Installer"
      messages={[{ type: "info" }]}
      Icon={() => <FiDownload size={"1.4em"} />}
      className="installer"
      placeholder="No packages installing"
      unCollapsed
    >
      <div className="progress-logs">
        {progressCardLogs.map((log, index) => (
          <ProgressLogsView key={`progress-log-${index}`} progressLogs={log} />
        ))}
      </div>
    </BaseDropdown>
  );
}
