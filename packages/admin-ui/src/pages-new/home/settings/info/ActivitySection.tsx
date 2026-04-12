import React, { useState } from "react";
import { useApi } from "api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Badge } from "components/primitives/badge";
import { Button } from "components/primitives/button";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { UserActionLog } from "@dappnode/types";

export function ActivitySection() {
  const [showCount, setShowCount] = useState(20);
  const userActionLogs = useApi.getUserActionLogs({ first: showCount });
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const logs: UserActionLog[] = userActionLogs.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Activity Log</CardTitle>
        <CardDescription>Recent actions performed on this Dappnode.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-2">
        {logs.length === 0 && <p className="tw:text-sm tw:text-muted-foreground">No activity logs available.</p>}
        {logs.map((log, i) => {
          const isExpanded = expanded[i] ?? false;
          const hasArgs = log.args && log.args.length > 0;
          const hasResult = log.result !== undefined && log.result !== null;
          return (
            <div key={i} className="tw:rounded-lg tw:border tw:p-3">
              <div
                className="tw:flex tw:items-start tw:gap-2 tw:cursor-pointer"
                onClick={() => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))}
              >
                <Badge variant={log.level === "error" ? "destructive" : "secondary"} className="tw:mt-0.5 tw:shrink-0">
                  {log.level || "info"}
                </Badge>
                <div className="tw:flex-1 tw:min-w-0">
                  <p className="tw:text-sm tw:font-medium tw:truncate">{log.event}</p>
                  <p className="tw:text-xs tw:text-muted-foreground">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}
                  </p>
                </div>
                {(hasArgs || hasResult) && (
                  <span className="tw:text-muted-foreground">
                    {isExpanded ? <ChevronUp className="tw:size-4" /> : <ChevronDown className="tw:size-4" />}
                  </span>
                )}
              </div>
              {isExpanded && (
                <div className="tw:mt-2 tw:ml-6 tw:rounded-md tw:bg-muted tw:p-2">
                  <pre className="tw:text-xs tw:whitespace-pre-wrap tw:font-mono">
                    {JSON.stringify({ args: log.args, result: log.result }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
        {logs.length >= showCount && (
          <Button variant="ghost" size="sm" onClick={() => setShowCount((c) => c + 20)} className="tw:w-full">
            Load more
          </Button>
        )}
        {logs.length > 0 && (
          <div className="tw:pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/api/userActionLogs" download="activity.json">
                <Download className="tw:size-3.5" />
                Download full log
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
