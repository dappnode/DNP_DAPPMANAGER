import React, { useState, useEffect } from "react";
import { api, apiRoutes } from "api";
// Components
import Card from "components/Card";
import Switch from "components/Switch";
import Input from "components/Input";
import Button from "components/Button";
import { Terminal } from "./Terminal";
import { ServiceSelector } from "./ServiceSelector";
// Utils
import newTabProps from "utils/newTabProps";
import { stringIncludes, stringSplit } from "utils/strings";
import { PackageContainer } from "@dappnode/common";
import "./logs.scss";

const refreshInterval = 2 * 1000;
const terminalID = "terminal";

const validateLines = (lines: number) => !isNaN(lines) && lines > 0;

export function Logs({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map(c => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);

  // User options
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timestamps, setTimestamps] = useState(false);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState(200);
  // Fetched data
  const [logs, setLogs] = useState("");

  const container = containers.find(c => c.serviceName === serviceName);
  const containerName = container?.containerName;

  /**
   * This use effect fetches the logs again everytime any of this variables changes:
   * - autoRefresh, timestamps, lines, dnp
   * In case of a fetch error, it will stop the autoRefresh
   * On every first fetch, it will automatically scroll to the bottom
   * On every first fetch, it will display "fetching..."
   */
  useEffect(() => {
    let scrollToBottom = () => {
      const el = document.getElementById(terminalID);
      if (el) el.scrollTop = el.scrollHeight;
      scrollToBottom = () => {};
    };
    let unmounted: boolean;

    async function logDnp() {
      try {
        if (!containerName) throw Error("No containerName");
        const options = { timestamps, tail: lines };
        const logs = await api.packageLog({ containerName, options });
        if (typeof logs !== "string") throw Error("Logs must be a string");

        // Prevent updating the state of an unmounted component
        if (unmounted) return;

        setLogs(logs);
        // Auto scroll to bottom (deffered after the paint)
        setTimeout(scrollToBottom, 10);
      } catch (e) {
        setLogs(`Error fetching logs: ${e.message}`);
        setAutoRefresh(false);
      }
    }
    setLogs("fetching...");
    if (autoRefresh) {
      const interval = setInterval(logDnp, refreshInterval);
      return () => {
        clearInterval(interval);
        unmounted = true;
      };
    } else {
      logDnp();
      return () => {
        unmounted = true;
      };
    }
  }, [autoRefresh, timestamps, lines, containerName]);

  /**
   * Filter the logs text by lines that contain the query
   * If the query is empty, skip the filter
   * If the query returned no matching logs, display custom message
   * If the lines parameter is not valid, display custom message
   */
  const logsArray = stringSplit(logs, /\r?\n/);
  let logsFiltered = query
    ? logsArray.filter(line => stringIncludes(line, query)).join("\n")
    : logs;
  if (logs && query && !logsFiltered) logsFiltered = "No match found";

  const terminalText = validateLines(lines)
    ? logsFiltered
    : "Lines must be a number > 0";

  return (
    <Card spacing>
      <ServiceSelector
        serviceName={serviceName}
        setServiceName={setServiceName}
        containers={containers}
      />

      <div className="logs-switches">
        <Switch
          checked={autoRefresh}
          onToggle={setAutoRefresh}
          label="Auto-refresh logs"
          id="switch-ar"
        />
        <Switch
          checked={timestamps}
          onToggle={setTimestamps}
          label="Display timestamps"
          id="switch-ts"
        />
      </div>

      <Input
        placeholder="Number of lines to display..."
        value={lines}
        onValueChange={newLines => setLines(parseInt(newLines) || 0)}
        type="number"
        prepend="Lines"
        append={
          containerName && (
            <a
              href={apiRoutes.containerLogsUrl({ containerName })}
              {...newTabProps}
            >
              <Button>Download all</Button>
            </a>
          )
        }
      />

      <Input
        placeholder="Filter by..."
        value={query}
        onValueChange={setQuery}
        prepend="Search"
      />

      <Terminal text={terminalText} id={terminalID} />
    </Card>
  );
}
