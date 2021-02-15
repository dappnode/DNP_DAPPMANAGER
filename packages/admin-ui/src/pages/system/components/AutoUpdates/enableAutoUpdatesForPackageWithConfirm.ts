import { api } from "api";
import { confirm } from "components/ConfirmDialog";
import { shortNameCapitalized } from "utils/format";
import { autoUpdateIds } from "params";

const { MY_PACKAGES } = autoUpdateIds;

/**
 * Helper to enable updates for a given package (or all) from another part of the UI
 * while keeping auto-update related logic in this file
 * @param dnpName
 */
export async function enableAutoUpdatesForPackageWithConfirm(
  dnpName: string
): Promise<void> {
  const { settings } = await api.autoUpdateDataGet();
  const autoUpdatesEnabledForAllPackages = settings[MY_PACKAGES]?.enabled;
  const autoUpdatesEnabledForThisPackage = settings[dnpName]?.enabled;

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

    await api.autoUpdateSettingsEdit({ id: idToEnable, enabled: true });
  }
}
