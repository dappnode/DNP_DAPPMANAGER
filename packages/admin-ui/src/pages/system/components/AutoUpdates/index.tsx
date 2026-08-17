import React, { useState } from "react";
import { useSelector } from "react-redux";
import { BsChevronDown } from "react-icons/bs";
import { api, useApi } from "api";
// Components
import Card from "components/Card";
import Button from "components/Button";
import Switch from "components/Switch";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
// Utils
import { prettyDnpName } from "utils/format";
import { autoUpdateIds } from "params";
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
  const [showPackageSettings, setShowPackageSettings] = useState(false);

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

  function confirmApplyDefault(enabled: boolean): void {
    const defaultLabel = enabled ? "enabled" : "disabled";
    confirm({
      title: `Apply the ${defaultLabel} default to all my packages?`,
      text: "This will remove every per-package customization and make all packages use the current default.",
      label: "Apply default to all",
      variant: enabled ? "dappnode" : "outline-danger",
      onClick: () => setUpdateSettings(MY_PACKAGES, enabled, true)
    });
  }

  return renderResponse(autoUpdateDataReq, ["Loading auto-update data"], (autoUpdateData) => {
    const { dnpsToShow = [], settings = {} } = autoUpdateData || {};
    const systemPackages = dnpsToShow.find(({ id }) => id === SYSTEM_PACKAGES);
    const myPackages = dnpsToShow.find(({ id }) => id === MY_PACKAGES);
    const singlePackages = dnpsToShow.filter(({ id }) => getIsSinglePackage(id));
    const customizedPackageCount = singlePackages.filter(({ id }) => Boolean(settings[id])).length;

    if (!systemPackages || !myPackages) return <Card>Auto-update settings are unavailable.</Card>;

    return (
      <Card>
        <div className="auto-updates-explanation">
          Enable auto-updates for DAppNode to install automatically the latest versions. For major breaking updates,
          your approval will always be required.
        </div>

        <section className="auto-updates-section">
          <div className="auto-updates-section-heading">
            <div>
              <h4>Default settings</h4>
              <p>These settings control automatic updates unless a package has its own customized setting.</p>
            </div>
          </div>

          <div className="auto-updates-default-setting">
            <span className="auto-update-name">
              <strong>System packages</strong>
              <small>All DAppNode system packages share this setting and are updated together.</small>
            </span>
            <Switch
              checked={systemPackages.enabled}
              onToggle={(enabled) => setUpdateSettings(SYSTEM_PACKAGES, enabled)}
              label=""
            />
          </div>

          <div className="auto-updates-default-setting">
            <span className="auto-update-name">
              <strong>My packages</strong>
              <small>Used by new packages and packages without a customized setting.</small>
            </span>
            <Switch
              checked={myPackages.enabled}
              onToggle={(enabled) => setUpdateSettings(MY_PACKAGES, enabled, false)}
              label=""
            />
          </div>
        </section>

        <section className="auto-updates-section">
          <div className="auto-updates-section-heading">
            <div>
              <h4>Per-package settings</h4>
              <p>Customize individual packages or reset every package to the current “My packages” default.</p>
            </div>
            <Button
              variant={myPackages.enabled ? "outline-dappnode" : "outline-danger"}
              disabled={singlePackages.length === 0}
              onClick={() => confirmApplyDefault(myPackages.enabled)}
            >
              Apply {myPackages.enabled ? "enabled" : "disabled"} default to all
            </Button>
          </div>

          <button
            type="button"
            className="auto-updates-section-expand"
            onClick={() => setShowPackageSettings((isOpen) => !isOpen)}
            aria-expanded={showPackageSettings}
          >
            <span>
              {showPackageSettings ? "Hide" : "Show"} {singlePackages.length} package settings
              {customizedPackageCount > 0 ? ` (${customizedPackageCount} customized)` : ""}
            </span>
            <BsChevronDown className={showPackageSettings ? "rotated" : ""} />
          </button>

          {showPackageSettings && (
            <div className="list-grid auto-updates auto-updates-package-list">
              <span className="state-badge" />
              <span className="name" />
              <span className="last-update header">Last auto-update</span>
              <span className="header">Enabled</span>
              <hr />

              {singlePackages.map(({ id, displayName, enabled, feedback }) => (
                <AutoUpdateRowItem
                  key={id}
                  {...{
                    id,
                    displayName,
                    enabled,
                    feedback,
                    isCustomized: Boolean(settings[id]),
                    isInstalling: Boolean((progressLogsByDnp || {})[id]),
                    isSinglePackage: true,
                    setUpdateSettings
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </Card>
    );
  });
}
