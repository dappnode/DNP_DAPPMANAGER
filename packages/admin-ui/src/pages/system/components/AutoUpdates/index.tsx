import React from "react";
import { useSelector } from "react-redux";
import { api, useApi } from "api";
// Components
import Card from "components/Card";
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

  async function setUpdateSettings(id: string, enabled: boolean): Promise<void> {
    try {
      const actioning = enabled ? "Enabling" : "Disabling";
      const actioned = enabled ? "Enabled" : "Disabled";
      const prettyName = prettyDnpName(id);
      await withToast(() => api.autoUpdateSettingsEdit({ id, enabled }), {
        message: `${actioning} auto updates for ${prettyName}...`,
        onSuccess: `${actioned} auto updates for ${prettyName}`
      });
    } catch (e) {
      console.error(`Error on autoUpdateSettingsEdit: ${e.stack}`);
    }
  }

  return renderResponse(autoUpdateDataReq, ["Loading auto-update data"], (autoUpdateData) => {
    const { dnpsToShow = [] } = autoUpdateData || {};

    return (
      <Card>
        <div className="auto-updates-explanation">
          Enable auto-updates for DAppNode to install automatically the latest versions. For major breaking updates,
          your approval will always be required.
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
                isInstalling: Boolean((progressLogsByDnp || {})[id === SYSTEM_PACKAGES ? coreDnpName : id]),
                isSinglePackage: getIsSinglePackage(id),
                // Actions
                setUpdateSettings
              }}
            />
          ))}
        </div>
      </Card>
    );
  });
}
