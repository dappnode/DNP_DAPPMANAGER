import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { api, useApi } from "api";
// Components
import Card from "components/Card";
import Alert from "react-bootstrap/Alert";
import Switch from "components/Switch";
import { withToast } from "components/toast/Toast";
import { confirm } from "components/ConfirmDialog";
// Utils
import { shortNameCapitalized } from "utils/format";
import { parseStaticDate, parseDiffDates } from "utils/dates";
import { coreDnpName, autoUpdateIds } from "params";
import { MdChevronRight } from "react-icons/md";
// External
import { getEthClientWarning } from "services/dappnodeStatus/selectors";
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";
import { activateFallbackPath } from "pages/system/data";
import { rootPath as installerRootPath } from "pages/installer";
import {
  rootPath as systemRootPath,
  subPaths as systemSubPaths
} from "pages/system/data";
// Styles
import "./autoUpdates.scss";
import { renderResponse } from "components/SwrRender";
import { resolve } from "path";

const { MY_PACKAGES, SYSTEM_PACKAGES } = autoUpdateIds;
const getIsSinglePackage = (id: string) =>
  id !== MY_PACKAGES && id !== SYSTEM_PACKAGES;

/**
 * Main auto-udpates view
 */
export default function AutoUpdates() {
  const autoUpdateDataReq = useApi.autoUpdateDataGet();
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);
  const ethClientWarning = useSelector(getEthClientWarning);

  async function setUpdateSettings(
    id: string,
    enabled: boolean
  ): Promise<void> {
    try {
      const actioning = enabled ? "Enabling" : "Disabling";
      const actioned = enabled ? "Enabled" : "Disabled";
      const dnpName = shortNameCapitalized(id);
      await withToast(() => api.autoUpdateSettingsEdit({ id, enabled }), {
        message: `${actioning} auto updates for ${dnpName}...`,
        onSuccess: `${actioned} auto updates for ${dnpName}`
      });
    } catch (e) {
      console.error(`Error on autoUpdateSettingsEdit: ${e.stack}`);
    }
  }

  return renderResponse(
    autoUpdateDataReq,
    ["Loading auto-update data"],
    autoUpdateData => {
      const { dnpsToShow = [] } = autoUpdateData || {};
      const someAutoUpdateIsEnabled =
        dnpsToShow.length > 0 && dnpsToShow.some(dnp => dnp.enabled);

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
            <span className="state-badge" />
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
                      id === SYSTEM_PACKAGES ? coreDnpName : id
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
  // Force a re-render every 15 seconds for the timeFrom to show up correctly
  const [, setClock] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setClock(n => n + 1), 15 * 1000);
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
        className={`state-badge center badge-${
          enabled ? "success" : "secondary"
        }`}
        style={{ opacity: 0.85 }}
      >
        <span className="content">{enabled ? "on" : "off"}</span>
      </span>

      <span className="name">
        {isSinglePackage && <MdChevronRight className="arrow" />}
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

/**
 * Helper to enable updates for a given package (or all) from another part of the UI
 * while keeping auto-update related logic in this file
 * @param dnpName
 */
export async function enableAutoUpdatesForPackageWithConfirm(
  dnpName: string
): Promise<void> {
  const autoUpdateData = await api.autoUpdateDataGet();
  const autoUpdatesEnabledForAllPackages =
    autoUpdateData.settings[MY_PACKAGES]?.enabled;
  const autoUpdatesEnabledForThisPackage =
    autoUpdateData.settings[dnpName]?.enabled;
  if (!autoUpdatesEnabledForAllPackages && !autoUpdatesEnabledForThisPackage) {
    // Allow user to enable for all packages or just this package
    const idToEnable = await new Promise<string>(resolve => {
      confirm({
        title: "Enable auto-updates",
        text: `Do you want to enable auto-update for ${shortNameCapitalized(
          dnpName
        )} so DAppNode to installs automatically the latest versions?`,
        buttons: [
          {
            label: "Enable for all packages",
            variant: "outline-secondary",
            onClick: () => resolve(MY_PACKAGES)
          },
          {
            label: "Enable",
            variant: "dappnode",
            onClick: () => resolve(dnpName)
          }
        ]
      });
    });
    api.autoUpdateSettingsEdit({ id: idToEnable, enabled: true });
  }
}
