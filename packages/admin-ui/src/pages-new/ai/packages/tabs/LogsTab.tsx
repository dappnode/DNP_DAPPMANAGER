import React, { useState, useEffect } from "react";
import { api, apiRoutes } from "api";
import { PackageContainer } from "@dappnode/types";
import { stringIncludes, stringSplit } from "utils/strings";
import { Card, CardContent, CardHeader, CardTitle } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Switch } from "components/primitives/switch";
import { ServiceSelector } from "../components/ServiceSelector";
import { Download, Search, Terminal as TerminalIcon } from "lucide-react";

const REFRESH_INTERVAL = 2_000;
const TERMINAL_ID = "ai-logs-terminal";
const validateLines = (n: number) => !isNaN(n) && n > 0;

export function LogsTab({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map((c) => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timestamps, setTimestamps] = useState(false);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState(200);
  const [logs, setLogs] = useState("");

  const container = containers.find((c) => c.serviceName === serviceName);
  const containerName = container?.containerName;

  useEffect(() => {
    let scrollToBottom = () => {
      const el = document.getElementById(TERMINAL_ID);
      if (el) el.scrollTop = el.scrollHeight;
      scrollToBottom = () => {};
    };
    let unmounted = false;

    async function fetchLogs() {
      try {
        if (!containerName) throw Error("No containerName");
        const result = await api.packageLog({ containerName, options: { timestamps, tail: lines } });
        if (typeof result !== "string") throw Error("Logs must be a string");
        if (unmounted) return;
        setLogs(result);
        setTimeout(scrollToBottom, 10);
      } catch (e) {
        setLogs(`Error fetching logs: ${(e as Error).message}`);
        setAutoRefresh(false);
      }
    }

    setLogs("fetching...");
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, REFRESH_INTERVAL);
      fetchLogs();
      return () => {
        clearInterval(interval);
        unmounted = true;
      };
    } else {
      fetchLogs();
      return () => {
        unmounted = true;
      };
    }
  }, [autoRefresh, timestamps, lines, containerName]);

  // Filter
  const logsArray = stringSplit(logs, /\r?\n/);
  let logsFiltered = query ? logsArray.filter((line) => stringIncludes(line, query)).join("\n") : logs;
  if (logs && query && !logsFiltered) logsFiltered = "No match found";

  const terminalText = validateLines(lines) ? logsFiltered : "Lines must be a number > 0";

  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="tw:flex tw:items-center tw:gap-2">
            <TerminalIcon className="tw:size-4" />
            Container Logs
          </CardTitle>
        </CardHeader>

        <CardContent className="tw:flex tw:flex-col tw:gap-4">
          {/* Service selector */}
          <ServiceSelector serviceName={serviceName} setServiceName={setServiceName} containers={containers} />

          {/* Controls row */}
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-6 tw:gap-y-3">
            {/* Auto-refresh */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor="auto-refresh" className="tw:text-sm tw:font-normal">
                Auto-refresh
              </Label>
            </div>

            {/* Timestamps */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <Switch id="timestamps" checked={timestamps} onCheckedChange={setTimestamps} />
              <Label htmlFor="timestamps" className="tw:text-sm tw:font-normal">
                Timestamps
              </Label>
            </div>

            {/* Lines */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <Label htmlFor="lines" className="tw:text-sm tw:font-normal tw:text-muted-foreground">
                Lines
              </Label>
              <Input
                id="lines"
                type="number"
                value={lines}
                onChange={(e) => setLines(parseInt(e.target.value) || 0)}
                className="tw:w-24"
              />
            </div>

            {/* Download */}
            {containerName && (
              <a href={apiRoutes.containerLogsUrl({ containerName })} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="tw:size-3.5 tw:mr-1.5" />
                  Download all
                </Button>
              </a>
            )}
          </div>

          {/* Search */}
          <div className="tw:relative">
            <Search className="tw:absolute tw:left-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:size-3.5 tw:text-muted-foreground" />
            <Input
              placeholder="Filter logs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="tw:pl-8"
            />
          </div>

          {/* Terminal */}
          <div
            id={TERMINAL_ID}
            className="tw:h-[420px] tw:overflow-auto tw:rounded-lg tw:bg-[#0d1117] tw:p-4 tw:font-mono tw:text-xs tw:leading-relaxed tw:text-[#c9d1d9] tw:whitespace-pre-wrap tw:break-all tw:ring-1 tw:ring-border"
          >
            {terminalText || "No logs available"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
