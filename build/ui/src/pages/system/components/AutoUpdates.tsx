import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import { api } from "api";
// Components
import Card from "components/Card";
import Alert from "react-bootstrap/Alert";
import Switch from "components/Switch";
import { withToast } from "components/toast/Toast";
// Utils
import { shortNameCapitalized } from "utils/format";
import { parseStaticDate, parseDiffDates } from "utils/dates";
import { coreName, autoUpdateIds } from "params";
// External
import { getEthClientWarning } from "services/dappnodeStatus/selectors";
import { getAutoUpdateData } from "services/dappnodeStatus/selectors";
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";
import { fetchAutoUpdateData } from "services/dappnodeStatus/actions";
import { activateFallbackPath } from "pages/system/data";
import { rootPath as installerRootPath } from "pages/installer";
import {
  rootPath as systemRootPath,
  subPaths as systemSubPaths
} from "pages/system/data";
// Styles
import "./autoUpdates.scss";

const { MY_PACKAGES, SYSTEM_PACKAGES } = autoUpdateIds;
const getIsSinglePackage = (id: string) =>
  id !== MY_PACKAGES && id !== SYSTEM_PACKAGES;

/**
 * Main auto-udpates view
 */
export default function AutoUpdates() {
  const autoUpdateData = useSelector(getAutoUpdateData);
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);
  const ethClientWarning = useSelector(getEthClientWarning);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAutoUpdateData());
  }, [dispatch]);

  const { dnpsToShow = [] } = autoUpdateData || {};
  const someAutoUpdateIsEnabled =
    dnpsToShow.length > 0 && dnpsToShow.some(dnp => dnp.enabled);

  // Force a re-render every 15 seconds for the timeFrom to show up correctly
  const [, setClock] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setClock(n => n + 1), 15 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  async function setUpdateSettings(
    id: string,
    enabled: boolean
  ): Promise<void> {
    try {
      const actioning = enabled ? "Enabling" : "Disabling";
      const actioned = enabled ? "Enabled" : "Disabled";
      const name = shortNameCapitalized(id);
      await withToast(() => api.autoUpdateSettingsEdit({ id, enabled }), {
        message: `${actioning} auto updates for ${name}...`,
        onSuccess: `${actioned} auto updates for ${name}`
      });
    } catch (e) {
      console.error(`Error on autoUpdateSettingsEdit: ${e.stack}`);
    }
  }

  return (
    <Card>
      <div className="auto-updates-explanation">
        Enable auto-updates for DAppNode to install automatically the latest
        versions. For major breaking updates, your approval will always be
        required.
      </div>

      {ethClientWarning && someAutoUpdateIsEnabled && (
        <Alert variant="warning">
          Auto-updates will not work temporarily. Eth client not available:{" "}
          {ethClientWarning}
          <br />
          Enable the{" "}
          <NavLink to={activateFallbackPath}>
            repository source fallback
          </NavLink>{" "}
          to have auto-updates meanwhile
        </Alert>
      )}

      <div className="list-grid auto-updates">
        {/* Table header */}
        <span className="stateBadge" />
        <span className="name" />
        <span className="last-update header">Last auto-update</span>
        <span className="header">Enabled</span>

        <hr />
        {/* Items of the table */}
        {dnpsToShow.map(({ id, displayName, enabled, feedback }) => (
          <AutoUpdateItem
            key={id}
            {...{
              id,
              displayName,
              enabled,
              feedback,
              isInstalling: Boolean(
                (progressLogsByDnp || {})[
                  id === SYSTEM_PACKAGES ? coreName : id
                ]
              ),
              isSinglePackage: getIsSinglePackage(id),
              // Actions
              setUpdateSettings
            }}
          />
        ))}
      </div>
    </Card>
  );
}

/**
 * Single row in the auto-updates grid table
 */
function AutoUpdateItem({
  id,
  displayName,
  enabled,
  feedback,
  isInstalling,
  isSinglePackage,
  // Actions
  setUpdateSettings
}: {
  id: string;
  displayName: string;
  enabled: boolean;
  feedback: any;
  isInstalling: boolean;
  isSinglePackage: boolean;
  setUpdateSettings: (id: string, enable: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const { updated, manuallyUpdated, inQueue, scheduled } = feedback;
  const errorMessage = feedback.errorMessage;

  const dnpInstallPath =
    id === MY_PACKAGES
      ? null
      : id === SYSTEM_PACKAGES
      ? `${systemRootPath}/${systemSubPaths.update}`
      : `${installerRootPath}/${id}`;

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
        className={`stateBadge center badge-${
          enabled ? "success" : "secondary"
        }`}
        style={{ opacity: 0.85 }}
      >
        <span className="content">{enabled ? "on" : "off"}</span>
      </span>

      <span className="name">
        {isSinglePackage && <span>> </span>}
        {displayName}
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

      <Switch
        checked={enabled ? true : false}
        onToggle={() => setUpdateSettings(id, !Boolean(enabled))}
        label=""
      />

      {!collapsed && <div className="extra-info">{errorMessage}</div>}

      <hr />
    </React.Fragment>
  );
}
