import shellExec from "../../utils/shell";
import params from "../../params";
import { eventBus, eventBusTag } from "../../eventBus";
const logs = require("../../logs")(module);

const monitoringInterval =
  params.CHECK_DISK_USAGE_WATCHER_INTERVAL || 60 * 1000; // (ms) (1 minute)

/**
 * Commands
 * docker ps --filter "name=DAppNodePackage" --format "{{.Names}}"
 * docker stop $(docker ps --filter "name=DAppNodePackage" -q)
 *
 * docker stop $(docker ps --filter "name=DAppNodePackage" --filter "name=DAppNodeCore-ethchain.dnp.dappnode.eth" --filter "name=DAppNodeCore-ipfs.dnp.dappnode.eth" -q)
 */

const thresholds = [
  {
    id: "dangerous level of 5 GB",
    kb: 5 * 1e6, // ~ 5 GB
    filterCommand: `--filter "name=DAppNodePackage"`,
    containersDescription: "all non-core DNPs"
  },
  {
    id: "critical level of 1 GB",
    kb: 1 * 1e6, // ~ 1 GB
    filterCommand: `--filter "name=DAppNodePackage" --filter "name=DAppNodeCore-ethchain.dnp.dappnode.eth" --filter "name=DAppNodeCore-ipfs.dnp.dappnode.eth"`,
    containersDescription: "all non-core DNPs plus the Ethchain and IPFS"
  }
];

const thresholdIsActive: {
  [thresholdId: string]: boolean;
} = {};

/**
 * Monitors disk usage of this DAppNode
 * If disk usage reaches a critical level (< 1GB)
 * it will stop all non cores + etchain + ipfs
 *
 * @returns {*}
 */
async function monitorDiskUsage() {
  try {
    const diskAvailable = await shellExec(`df -k / | awk 'NR>1 { print $4}'`);
    if (!diskAvailable || typeof diskAvailable !== "string")
      throw Error("diskAvailable return must be a string");

    const diskAvailableBytes = parseInt(diskAvailable.trim());
    if (isNaN(diskAvailableBytes))
      throw Error("diskAvailableBytes must be a number");

    for (const threshold of thresholds) {
      if (diskAvailableBytes < threshold.kb) {
        /**
         * This is a critical function that has failed in the past. The
         * execution order is critical and should be from more prioritary to
         * less, such as logging
         * - Do not use dnpList, use pure docker commands with filters
         * - Set the active cache first
         */

        // If packages have already been stopped, skip
        if (thresholdIsActive[threshold.id]) continue;
        else thresholdIsActive[threshold.id] = true;

        // Log that the threshold has been triggered
        logs.warn(`Disk usage threshold "${threshold.id}" has been triggered`);

        /**
         * Stop the DNPs using a docker filter.
         * Since calling docker stop without containers will throw an error,
         * a try catch will safe guard for that possibility
         * `docker stop $(docker ps --filter "name=DAppNodePackage" -q)`
         * - if there are containers
         *   names: 'DAppNodePackage-hello3\nDAppNodePackage-hello2\nDAppNodePackage-hello'
         * - if there are NOT containers
         *   names: ''
         */
        let names;
        const cmd = `docker stop $(docker ps ${
          threshold.filterCommand
        } --format "{{.Names}}")`;
        try {
          names = await shellExec(cmd);
        } catch (e) {
          if (e.message.includes("requires at least 1 argument")) {
            logs.warn(`No containers stopped by the "${cmd}" command`);
          } else {
            logs.error(
              `Error stopping containers on disk usage watcher: ${e.stack}`
            );
          }
        }

        // Format the names output to display the exact list of stopped containers
        const formatedNames =
          names && typeof names === "string"
            ? names
                .replace(/\r?\n/g, ", ")
                .replace(/(DAppNodePackage-)|(DAppNodeCore-)/g, "")
            : "no DNPs";

        logs.warn(
          `WARNING: DAppNode has stopped ${
            threshold.containersDescription
          } (${formatedNames}) after the disk space reached a ${threshold.id}`
        );

        eventBus.emit(eventBusTag.pushNotification, {
          id: "diskSpaceRanOut-stoppedPackages",
          type: "danger",
          title: `Disk space is running out, ${threshold.id.split(" ")[0]}`,
          body: `Available disk space is less than a ${
            threshold.id
          }. To prevent your DAppNode from becoming unusable ${
            threshold.containersDescription
          } where stopped (${formatedNames}). Please, free up enough disk space and start them again.`
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

setInterval(() => {
  monitorDiskUsage();
}, monitoringInterval);

export default monitorDiskUsage;
