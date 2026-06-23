import React from "react";
import { isEmpty } from "lodash-es";
import { prettyDnpName } from "utils/format";
import { Progress } from "components/primitives/progress";
import { Card, CardContent } from "components/primitives/card";
import { Spinner } from "components/primitives/spinner";
import { ProgressLogs } from "types";

/**
 * Parse a percentage value from a progress log string like "Downloading 64%".
 */
function parsePercent(s: string): number | null {
  const match = (s || "").match(/\s(\d+?)%/);
  return match ? parseInt(match[1], 10) : null;
}

interface InstallerProgressLogsProps {
  progressLogs?: ProgressLogs;
  isInstalling?: boolean;
}

/**
 * Displays live installation progress for each package being installed.
 * Shown inline below the package hero header.
 */
export function InstallerProgressLogs({ progressLogs, isInstalling }: InstallerProgressLogsProps) {
  const hasLogs = progressLogs && !isEmpty(progressLogs);
  const entries = hasLogs ? Object.entries(progressLogs).filter(([name]) => name !== "core.dnp.dappnode.eth") : [];

  // Show spinner when installing but no logs have arrived yet
  if (!hasLogs && isInstalling) {
    return (
      <Card>
        <CardContent className="tw:flex tw:items-center tw:gap-3 tw:py-4">
          <Spinner className="tw:size-5 tw:text-primary" />
          <span className="tw:text-sm tw:text-muted-foreground">Preparing installation…</span>
        </CardContent>
      </Card>
    );
  }

  if (!hasLogs) return null;

  return (
    <Card>
      <CardContent className="tw:flex tw:flex-col tw:gap-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Spinner className="tw:size-4 tw:text-primary" />
          <span className="tw:text-sm tw:font-medium tw:text-foreground">
            Installing{entries.length > 1 ? ` (${entries.length} packages)` : ""}…
          </span>
        </div>

        {entries.map(([dnpName, log = ""]) => {
          const percent = parsePercent(log);
          const displayPercent = percent ?? 100;

          return (
            <div key={dnpName} className="tw:flex tw:flex-col tw:gap-1.5">
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
                <span className="tw:text-sm tw:font-medium tw:text-foreground">{prettyDnpName(dnpName)}</span>
                <span className="tw:text-xs tw:text-muted-foreground tw:truncate tw:max-w-[50%] tw:text-right tw:tabular-nums">
                  {percent !== null ? `${percent}%` : log}
                </span>
              </div>
              <Progress value={displayPercent} className={"tw:animate-pulse"} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
