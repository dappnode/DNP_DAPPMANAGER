const shellExec = require("utils/shell");
const dockerList = require("modules/dockerList");
const logs = require("logs.js")(module);
const { eventBus, eventBusTag } = require("eventBus");

const thresholds = [
  {
    id: "dangerous level of 5 GB",
    kb: 5 * 1e6, // ~ 5 GB
    filter: dnp => dnp.isDNP
  },
  {
    id: "critical level of 1 GB",
    kb: 1 * 1e6, // ~ 1 GB
    filter: dnp =>
      dnp.isDNP ||
      dnp.name === "ethchain.dnp.dappnode.eth" ||
      dnp.name === "ipfs.dnp.dappnode.eth"
  }
];
const monitoringInterval = 60 * 1000; // (ms)

const thresholdIsActive = {};

/**
 * Monitors disk usage of this DAppNode
 * If disk usage reaches a critical level (< 1GB)
 * it will stop all non cores + etchain + ipfs
 *
 * @return {*}
 */
async function monitorDiskUsage() {
  try {
    const diskAvailable = await shellExec(
      `df -k / | awk 'NR>1 { print $4}'`,
      true
    );
    if (!diskAvailable || typeof diskAvailable !== "string")
      throw Error("diskAvailable return must be a string");

    const diskAvailableBytes = parseInt(diskAvailable.trim());
    if (isNaN(diskAvailable))
      throw Error("diskAvailableBytes must be a number");

    for (const threshold of thresholds) {
      if (diskAvailableBytes < threshold.kb) {
        // If packages have already been stopped, skip
        if (thresholdIsActive[threshold.id]) return;
        const dnpList = await dockerList.listContainers();
        const dnpsToStop = dnpList.filter(threshold.filter);
        const dnpsToStopIds = dnpsToStop.map(({ id }) => id);
        const dnpsToStopNames = dnpsToStop.map(({ name }) => name);
        await shellExec(`docker stop ${dnpsToStopIds.join(" ")}`);

        logs.warn(
          `WARNING: DAppNode has stopped these containers after the disk space reached a ${
            threshold.id
          }: \n${dnpsToStopNames.join(", ")}`
        );
        eventBus.emit(eventBusTag.pushNotification, {
          id: "diskSpaceRanOut-stoppedPackages",
          type: "danger",
          title: `Disk space is running out, stopped ${
            dnpsToStopNames.length
          } DNPs`,
          body: `Available disk space is less than a ${
            threshold.id
          }. To prevent your DAppNode from becoming unusable some DNPs where stopped: ${dnpsToStopNames.join(
            ", "
          )}. Please, free up disk space and start them again.`
        });
        thresholdIsActive[threshold.id] = true;

        // Emit packages update
        eventBus.emit(eventBusTag.emitPackages);
      } else if (diskAvailableBytes > 1.2 * threshold.kb) {
        // If there is again enough free space, allow packages to be stopped
        // if disk space runs out agains
        if (thresholdIsActive[threshold.id])
          thresholdIsActive[threshold.id] = false;
      }
    }
  } catch (e) {
    logs.error(`Error monitoring disk usage: ${e.stack}`);
  }
}

setInterval(async () => {
  monitorDiskUsage();
}, monitoringInterval);

module.exports = monitorDiskUsage;
