import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Switch from "components/Switch";
import { parseStaticDate, parseDiffDates } from "utils/dates";
import { autoUpdateIds } from "params";
import { getInstallerPath } from "pages/installer";
import { pathName as systemPathName, subPaths as systemSubPaths } from "pages/system/data";

const { MY_PACKAGES, SYSTEM_PACKAGES } = autoUpdateIds;

/**
 * Single row in the auto-updates grid table
 */
export function AutoUpdateRowItem({
  id,
  displayName,
  enabled,
  feedback,
  isMixed,
  isCustomized,
  isInstalling,
  isSinglePackage,
  isDefaultControl,
  // Actions
  setUpdateSettings
}: {
  id: string;
  displayName: string;
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  feedback: any;
  isMixed: boolean;
  isCustomized: boolean;
  isInstalling: boolean;
  isSinglePackage: boolean;
  isDefaultControl: boolean;
  setUpdateSettings: (id: string, enable: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  // Force a re-render every 15 seconds for the timeFrom to show up correctly
  const [, setClock] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setClock((n) => n + 1), 15 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const { updated, manuallyUpdated, inQueue, scheduled } = feedback;
  const errorMessage = feedback.errorMessage;

  const dnpInstallPath =
    id === MY_PACKAGES
      ? null
      : id === SYSTEM_PACKAGES
        ? `${systemPathName}/${systemSubPaths.update}`
        : `${getInstallerPath(id)}/${id}`;

  const feedbackText = !enabled
    ? "-"
    : isInstalling
      ? "Updating..."
      : manuallyUpdated
        ? "Manually updated"
        : inQueue
          ? "In queue..."
          : scheduled
            ? `Scheduled, in ${parseDiffDates(scheduled)}`
            : updated
              ? parseStaticDate(updated)
              : "-";

  const showUpdateLink = isInstalling || inQueue || scheduled;

  return (
    <React.Fragment key={id}>
      <span
        className={`state-badge center badge-${isMixed ? "warning" : enabled ? "success" : "secondary"}`}
        style={{ opacity: 0.85 }}
      >
        <span className="content">{isMixed ? "mixed" : enabled ? "on" : "off"}</span>
      </span>

      <span className="name">
        {isSinglePackage && <li className="bullet" />}
        <span className="auto-update-name">
          <span>{displayName}</span>
          {isSinglePackage && <small>{isCustomized ? "Customized" : "Using default"}</small>}
          {isDefaultControl && <small>Used by new and non-customized packages</small>}
        </span>
      </span>

      <span className="last-update">
        {showUpdateLink && dnpInstallPath ? (
          <NavLink className="name" to={dnpInstallPath}>
            {feedbackText}
          </NavLink>
        ) : (
          <span>{feedbackText}</span>
        )}
        {errorMessage ? (
          <span className="error" onClick={() => setCollapsed(!collapsed)}>
            Error on update
          </span>
        ) : null}
      </span>

      <Switch checked={enabled} onToggle={(checked) => setUpdateSettings(id, checked)} label="" />

      {!collapsed && <div className="extra-info">{errorMessage}</div>}

      <hr />
    </React.Fragment>
  );
}
