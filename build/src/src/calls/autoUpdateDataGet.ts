import semver from "semver";
import params from "../params";
import { listContainers } from "../modules/docker/listContainers";
import { getCoreVersionId } from "../utils/coreVersionId";
import * as autoUpdateHelper from "../utils/autoUpdateHelper";
import { shortNameCapitalized } from "../utils/format";
import {
  AutoUpdateSettings,
  AutoUpdateRegistry,
  AutoUpdatePending,
  AutoUpdateFeedback,
  RpcHandlerReturnWithResult
} from "../types";

const { MY_PACKAGES, SYSTEM_PACKAGES } = autoUpdateHelper;

interface DnpsToShowInterface {
  id: string;
  displayName: string;
  enabled: boolean;
  feedback: AutoUpdateFeedback;
}

interface ReturnData {
  settings: AutoUpdateSettings;
  registry: AutoUpdateRegistry;
  pending: AutoUpdatePending;
  dnpsToShow: DnpsToShowInterface[];
}

/**
 * Returns a auto-update data:
 * - settings: If auto-updates are enabled for a specific DNP or DNPs
 * - registry: List of executed auto-updates
 * - pending: Pending auto-update per DNP, can be already executed
 * - dnpsToShow: Parsed data to be shown in the UI
 *
 * @returns {object} result = {
 *   settings: {
 *     "system-packages": { enabled: true }
 *     "my-packages": { enabled: true }
 *     "bitcoin.dnp.dappnode.eth": { enabled: false }
 *   },
 *   registry: { "core.dnp.dappnode.eth": {
 *     "0.2.4": { updated: 1563304834738, successful: true },
 *     "0.2.5": { updated: 1563304834738, successful: false }
 *   }, ... },
 *   pending: { "core.dnp.dappnode.eth": {
 *     version: "0.2.4",
 *     firstSeen: 1563218436285,
 *     scheduledUpdate: 1563304834738,
 *     completedDelay: true
 *   }, ... },
 *   dnpsToShow: [{
 *     id: "system-packages",
 *     displayName: "System packages",
 *     enabled: true,
 *     feedback: {
 *       updated: 15363818244,
 *       manuallyUpdated: true,
 *       inQueue: true,
 *       scheduled: 15363818244
 *     }
 *   }, ... ]
 * }
 */
export default async function autoUpdateDataGet(): RpcHandlerReturnWithResult<
  ReturnData
> {
  const settings = autoUpdateHelper.getSettings();
  const registry = autoUpdateHelper.getRegistry();
  const pending = autoUpdateHelper.getPending();

  const dnpList = await listContainers();

  const dnpsToShow: DnpsToShowInterface[] = [
    {
      id: SYSTEM_PACKAGES,
      displayName: "System packages",
      enabled: autoUpdateHelper.isCoreUpdateEnabled(),
      feedback: autoUpdateHelper.getCoreFeedbackMessage({
        currentVersionId: getCoreVersionId(
          dnpList.filter(({ isCore }) => isCore)
        )
      })
    },
    {
      id: MY_PACKAGES,
      displayName: "My packages",
      enabled: autoUpdateHelper.isDnpUpdateEnabled(),
      feedback: {}
    }
  ];

  if (autoUpdateHelper.isDnpUpdateEnabled()) {
    const singleDnpsToShow = [];
    for (const dnp of dnpList) {
      const storedDnp = singleDnpsToShow.find(_dnp => _dnp.name === dnp.name);
      const storedVersion = storedDnp ? storedDnp.version : "";
      if (
        dnp.name &&
        // Ignore core DNPs
        dnp.isDnp &&
        // Ignore wierd versions
        semver.valid(dnp.version) &&
        // MUST come from the APM
        (!dnp.origin || params.AUTO_UPDATE_INCLUDE_IPFS_VERSIONS) &&
        // Ensure there are no duplicates
        (!storedVersion || semver.gt(storedVersion, dnp.version))
      )
        singleDnpsToShow.push(dnp);
    }

    for (const dnp of singleDnpsToShow) {
      const enabled = autoUpdateHelper.isDnpUpdateEnabled(dnp.name);
      dnpsToShow.push({
        id: dnp.name,
        displayName: shortNameCapitalized(dnp.name),
        enabled,
        feedback: enabled
          ? autoUpdateHelper.getDnpFeedbackMessage({
              id: dnp.name,
              currentVersion: dnp.version
            })
          : {}
      });
    }
  }

  return {
    message: `Got auto update data`,
    result: {
      settings,
      registry,
      pending,
      dnpsToShow
    }
  };
}
