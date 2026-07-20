import React from "react";
import { useSelector } from "react-redux";
import { api, useApi } from "api";
// Components
import Card from "components/Card";
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
// Utils
import { prettyDnpName } from "utils/format";
import { coreDnpName, autoUpdateIds } from "params";
// External
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";
// Styles
import "./autoUpdates.scss";
import { renderResponse } from "components/SwrRender";
import { AutoUpdateRowItem } from "./AutoUpdateRowItem";
export * from "./enableAutoUpdatesForPackageWithConfirm";

const { MY_PACKAGES, SYSTEM_PACKAGES } = autoUpdateIds;
const getIsSinglePackage = (id: string) => id !== MY_PACKAGES && id !== SYSTEM_PACKAGES;

/**
 * Main auto-udpates view
 */
export default function AutoUpdates() {
  const autoUpdateDataReq = useApi.autoUpdateDataGet();
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);

  async function setUpdateSettings(id: string, enabled: boolean, applyToAll?: boolean): Promise<void> {
    try {
      const actioning = enabled ? "Enabling" : "Disabling";
      const actioned = enabled ? "Enabled" : "Disabled";
      const prettyName = applyToAll
        ? "all my packages"
        : id === MY_PACKAGES
          ? "the package default"
          : prettyDnpName(id);
      await withToast(() => api.autoUpdateSettingsEdit({ id, enabled, applyToAll }), {
        message: `${actioning} auto updates for ${prettyName}...`,
        onSuccess: `${actioned} auto updates for ${prettyName}`
      });
    } catch (e) {
      console.error(`Error on autoUpdateSettingsEdit: ${e.stack}`);
    }
  }

  function confirmSetAllPackages(enabled: boolean): void {
    const action = enabled ? "Enable" : "Disable";
    confirm({
      title: `${action} auto-updates for all my packages?`,
      text: "This will remove every per-package customization and cannot be undone automatically.",
      label: `${action} all my packages`,
      variant: enabled ? "dappnode" : "outline-danger",
      onClick: () => setUpdateSettings(MY_PACKAGES, enabled, true)
    });
  }

  return renderResponse(autoUpdateDataReq, ["Loading auto-update data"], (autoUpdateData) => {
    const { dnpsToShow = [], settings = {} } = autoUpdateData || {};
    const myPackages = dnpsToShow.find(({ id }) => id === MY_PACKAGES);
    const packageSettingsAreMixed = dnpsToShow
      .filter(({ id }) => getIsSinglePackage(id))
      .some(({ enabled }) => enabled !== myPackages?.enabled);

    return (
      <Card>
        <div className="auto-updates-explanation">
          Enable auto-updates for DAppNode to install automatically the latest versions. For major breaking updates,
          your approval will always be required.
        </div>

        <div className="auto-updates-bulk-actions">
          <span>Default changes preserve customized packages.</span>
          <div className="buttons">
            <Button variant="outline-dappnode" onClick={() => confirmSetAllPackages(true)}>
              Enable all my packages
            </Button>
            <Button variant="outline-danger" onClick={() => confirmSetAllPackages(false)}>
              Disable all my packages
            </Button>
          </div>
        </div>

        <div className="list-grid auto-updates">
          {/* Table header */}
          <span className="state-badge" />
          <span className="name" />
          <span className="last-update header">Last auto-update</span>
          <span className="header">Enabled</span>

          <hr />
          {/* Items of the table */}
          {dnpsToShow.map(({ id, displayName, enabled, feedback }) => (
            <AutoUpdateRowItem
              key={id}
              {...{
                id,
                displayName,
                enabled,
                feedback,
                isMixed: id === MY_PACKAGES && packageSettingsAreMixed,
                isCustomized: getIsSinglePackage(id) && Boolean(settings[id]),
                isInstalling: Boolean((progressLogsByDnp || {})[id === SYSTEM_PACKAGES ? coreDnpName : id]),
                isSinglePackage: getIsSinglePackage(id),
                isDefaultControl: id === MY_PACKAGES,
                // Actions
                setUpdateSettings: (settingId: string, settingEnabled: boolean) =>
                  setUpdateSettings(settingId, settingEnabled, settingId === MY_PACKAGES ? false : undefined)
              }}
            />
          ))}
        </div>
      </Card>
    );
  });
}
