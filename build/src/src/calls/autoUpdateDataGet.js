const semver = require("semver");
const params = require("params");
const { listContainers } = require("modules/dockerList");
const { getCoreVersionId } = require("utils/coreVersionId");
const autoUpdateHelper = require("utils/autoUpdateHelper");
const { shortNameCapitalized } = require("utils/format");

const { MY_PACKAGES, SYSTEM_PACKAGES } = autoUpdateHelper;

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
async function autoUpdateDataGet() {
  const settings = await autoUpdateHelper.getSettings();
  const registry = await autoUpdateHelper.getRegistry();
  const pending = await autoUpdateHelper.getPending();

  const dnpList = await listContainers();

  const dnpsToShow = [
    {
      id: SYSTEM_PACKAGES,
      displayName: "System packages",
      enabled: await autoUpdateHelper.isCoreUpdateEnabled(),
      feedback: await autoUpdateHelper.getCoreFeedbackMessage({
        currentVersionId: getCoreVersionId(
          dnpList.filter(({ isCore }) => isCore)
        )
      })
    },
    {
      id: MY_PACKAGES,
      displayName: "My packages",
      enabled: await autoUpdateHelper.isDnpUpdateEnabled(),
      feedback: {}
    }
  ];

  if (await autoUpdateHelper.isDnpUpdateEnabled()) {
    const singleDnpsToShow = [];
    for (const dnp of dnpList) {
      const storedDnp = singleDnpsToShow.find(_dnp => _dnp.name === dnp.name);
      const storedVersion = (storedDnp || {}).version;
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
      const enabled = await autoUpdateHelper.isDnpUpdateEnabled(dnp.name);
      dnpsToShow.push({
        id: dnp.name,
        displayName: shortNameCapitalized(dnp.name),
        enabled,
        feedback: enabled
          ? await autoUpdateHelper.getDnpFeedbackMessage({
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

module.exports = autoUpdateDataGet;
