import semver from "semver";
import { listPackages } from "../modules/docker/list";
import * as autoUpdateHelper from "../utils/autoUpdateHelper";
import { prettyDnpName } from "../utils/format";
import {
  AutoUpdateDataView,
  AutoUpdateDataDnpView,
  InstalledPackageData
} from "@dappnode/common";

const { MY_PACKAGES, SYSTEM_PACKAGES } = autoUpdateHelper;

/**
 * Returns a auto-update data:
 * - settings: If auto-updates are enabled for a specific DNP or DNPs
 * - registry: List of executed auto-updates
 * - pending: Pending auto-update per DNP, can be already executed
 * - dnpsToShow: Parsed data to be shown in the UI
 */
export async function autoUpdateDataGet(): Promise<AutoUpdateDataView> {
  const settings = autoUpdateHelper.getSettings();
  const registry = autoUpdateHelper.getRegistry();
  const pending = autoUpdateHelper.getPending();

  const dnpList = await listPackages();

  const dnpsToShow: AutoUpdateDataDnpView[] = [
    {
      id: SYSTEM_PACKAGES,
      displayName: "System packages",
      enabled: autoUpdateHelper.isCoreUpdateEnabled(),
      feedback: autoUpdateHelper.getCoreFeedbackMessage(
        dnpList.filter(({ isCore }) => isCore)
      )
    },
    {
      id: MY_PACKAGES,
      displayName: "My packages",
      enabled: autoUpdateHelper.isDnpUpdateEnabled(),
      feedback: {}
    }
  ];

  if (autoUpdateHelper.isDnpUpdateEnabled()) {
    const singleDnpsToShow: InstalledPackageData[] = [];
    for (const dnp of dnpList) {
      const storedDnp = singleDnpsToShow.find(
        _dnp => _dnp.dnpName === dnp.dnpName
      );
      const storedVersion = storedDnp ? storedDnp.version : "";
      if (
        dnp.dnpName &&
        // Ignore core DNPs
        dnp.isDnp &&
        !dnp.isCore &&
        // Ignore wierd versions
        semver.valid(dnp.version) &&
        // Ensure there are no duplicates
        (!storedVersion || semver.gt(storedVersion, dnp.version))
      )
        singleDnpsToShow.push(dnp);
    }

    for (const dnp of singleDnpsToShow) {
      const enabled = autoUpdateHelper.isDnpUpdateEnabled(dnp.dnpName);
      dnpsToShow.push({
        id: dnp.dnpName,
        displayName: prettyDnpName(dnp.dnpName),
        enabled,
        feedback: enabled
          ? autoUpdateHelper.getDnpFeedbackMessage({
              dnpName: dnp.dnpName,
              currentVersion: dnp.version
            })
          : {}
      });
    }
  }

  return {
    settings,
    registry,
    pending,
    dnpsToShow
  };
}
