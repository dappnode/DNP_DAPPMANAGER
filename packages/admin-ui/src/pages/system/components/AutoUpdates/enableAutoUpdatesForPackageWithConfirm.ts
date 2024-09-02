import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import { prettyDnpName } from "utils/format";
import { autoUpdateIds } from "params";
import { withToastNoThrow } from "components/toast/Toast";

const { MY_PACKAGES } = autoUpdateIds;

/**
 * Helper to enable updates for a given package (or all) from another part of the UI
 * while keeping auto-update related logic in this file
 * @param dnpName
 */
export async function enableAutoUpdatesForPackageWithConfirm(dnpName: string): Promise<void> {
  const { settings } = await api.autoUpdateDataGet();
  const autoUpdatesEnabledForAllPackages = settings[MY_PACKAGES]?.enabled;
  const autoUpdatesEnabledForThisPackage = settings[dnpName]?.enabled;
  const prettyName = prettyDnpName(dnpName);

  if (!autoUpdatesEnabledForAllPackages && !autoUpdatesEnabledForThisPackage) {
    // Allow user to enable for all packages or just this package
    const enableForAll = await new Promise<boolean>((resolve) => {
      confirm({
        title: "Enable auto-updates",
        text: `Do you want to enable auto-update for ${prettyName} so DAppNode to installs automatically the latest versions?`,
        buttons: [
          {
            label: "Enable for all packages",
            variant: "outline-secondary",
            onClick: () => resolve(true)
          },
          {
            label: "Enable",
            variant: "dappnode",
            onClick: () => resolve(false)
          }
        ]
      });
    });

    const id = enableForAll ? MY_PACKAGES : dnpName;
    const logId = enableForAll ? "all packages" : prettyName;
    await withToastNoThrow(() => api.autoUpdateSettingsEdit({ id, enabled: true }), {
      message: `Enabling auto-updates for ${logId}`,
      onSuccess: `Enabled auto-updates for ${logId}`
    });
  }
}
