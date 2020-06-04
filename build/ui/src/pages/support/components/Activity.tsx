import React, { useState, useEffect, useMemo } from "react";
import { useSubscription, useApi } from "api";
import { UserActionLog } from "types";
import { apiUrls } from "params";
// Components
import CardList from "components/CardList";
import ErrorView from "components/Error";
import Loading from "components/Loading";
import Button from "components/Button";
// Utils
import { parseStaticDate } from "utils/dates";
import { stringifyObjSafe } from "utils/objects";
import { stringSplit } from "utils/strings";
import newTabProps from "utils/newTabProps";
// Own module
import "./activity.css";

const badgeClass = "badge badge-pill badge-";
const downloadUserActionLogsUrl = apiUrls.userActionLogs;

function parseLevel(level: "error" | "warn" | "info"): string {
  if (level === "error") return "danger";
  if (level === "warn") return "warning";
  if (level === "info") return "success";
  return "";
}

export default function Activity() {
  const [count, setCount] = useState(50);
  const userActionLogs = useApi.getUserActionLogs({ first: count });
  useSubscription.userActionLog(userActionLogs.revalidate);

  function loadMore() {
    setCount(n => n + 50);
  }

  return (
    <>
      <p>
        If a developer asks for more information regarding an error; please find
        the error in the list below, tap on it and copy everything in the
        expanded grey text area.
      </p>

      <div>
        <a
          href={downloadUserActionLogsUrl}
          {...newTabProps}
          className="no-a-style"
        >
          <Button variant="dappnode"> Download all logs</Button>
        </a>
      </div>

      {/* Activity list */}
      {userActionLogs.data ? (
        <CardList>
          {userActionLogs.data.map((log, i) => (
            <ActivityItem key={i} log={log} />
          ))}
        </CardList>
      ) : userActionLogs.error ? (
        <ErrorView msg={userActionLogs.error.message}></ErrorView>
      ) : userActionLogs.isValidating ? (
        <Loading msg="Loading user action logs" />
      ) : null}

      {userActionLogs.data && userActionLogs.data.length === count && (
        <Button onClick={loadMore}>Load more</Button>
      )}
    </>
  );
}

function ActivityItem({ log }: { log: UserActionLog }) {
  const [collapsed, setCollapsed] = useState(true);

  const type = parseLevel(log.level);
  const date = parseStaticDate(log.timestamp);
  const eventShort = stringSplit(log.event, ".")[0];

  // Force a re-render every 15 seconds for the timeFrom to show up correctly
  const [, setClock] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setClock(n => n + 1), 15 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  // memo JSON.stringify to prevent re-running it every time the clock is refreshed
  const argsString = useMemo(
    () =>
      Array.isArray(log.args) && log.args.length === 1
        ? stringifyObjSafe(log.args[0])
        : stringifyObjSafe(log.args),
    [log.args]
  );

  return (
    <div className="user-log">
      <div
        className="list-group-item-action log-container"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="d-flex justify-content-between">
          {/* Top row - left */}
          <div className="log-header">
            {/* Error badge */}
            {log.level === "error" ? (
              <span className={badgeClass + type}>{log.level}</span>
            ) : null}
            {/* Count badge */}
            {log.count ? (
              <span className={badgeClass + "light"}>{log.count}</span>
            ) : null}
            {/* Call name */}
            <span className={"text-" + type}>
              <span className="call-to">Call to</span>{" "}
              <strong>{eventShort}</strong>
            </span>
          </div>
          {/* Top row - right */}
          <div className="date">{date}</div>
        </div>
        {/* Bottom row */}
        <span className="reply">Reply:</span> {log.message}
      </div>
      <div className={collapsed ? "hide" : "show"}>
        <div className={"error-stack" + (collapsed ? " hide" : "")}>
          {log.stack ? `${log.stack}\n\n` : null}
          {argsString ? argsString : ""}
        </div>
      </div>
    </div>
  );
}
