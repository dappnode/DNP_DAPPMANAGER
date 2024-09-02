import * as db from "@dappnode/db";
import { shell, runAtMostEvery, prettyDnpName } from "@dappnode/utils";
import { params } from "@dappnode/params";
import { eventBus } from "@dappnode/eventbus";
import { logs } from "@dappnode/logger";

/**
 * Commands
 * docker ps --filter "name=DAppNodePackage" --format "{{.Names}}"
 * docker stop $(docker ps --filter "name=DAppNodePackage" -q)
 *
 * docker stop $(docker ps --filter "name=DAppNodePackage" --filter "name=DAppNodeCore-sample.dnp.dappnode.eth" -q)
 */

const thresholds = [
  {
    id: "dangerous level of 5 GB",
    kb: 5 * 1e6, // ~ 5 GB
    filterCommand: `--filter "name=DAppNodePackage"`,
    containersDescription: "all non-core DAppNode packages"
  },
  {
    id: "critical level of 1 GB",
    kb: 1 * 1e6, // ~ 1 GB
    filterCommand: `--filter "name=DAppNodePackage" --filter "name=DAppNodeCore-ipfs.dnp.dappnode.eth"`,
    containersDescription: "all non-core DAppNode packages and the IPFS package"
  }
];

/**
 * Monitors disk usage of this DAppNode
 * If disk usage reaches a critical level (< 1GB)
 * it will stop all non cores + etchain + ipfs
 */
async function monitorDiskUsage(): Promise<void> {
  try {
    const diskAvailable = await shell(`df -k / | awk 'NR>1 { print $4}'`);
    if (!diskAvailable || typeof diskAvailable !== "string") throw Error("diskAvailable return must be a string");

    const diskAvailableKBytes = parseInt(diskAvailable.trim());
    if (isNaN(diskAvailableKBytes)) throw Error("diskAvailableKBytes must be a number");

    for (const threshold of thresholds) {
      const thresholdIsActive = db.diskUsageThreshold.get(threshold.id);

      if (diskAvailableKBytes < threshold.kb) {
        /**
         * This is a critical function that has failed in the past. The
         * execution order is critical and should be from more prioritary to
         * less, such as logging
         * - Do not use dnpList, use pure docker commands with filters
         * - Set the active cache first
         */

        // If packages have already been stopped, skip

        if (thresholdIsActive) continue;
        db.diskUsageThreshold.set(threshold.id, true);

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
        const cmd = `docker stop $(docker ps ${threshold.filterCommand} --format "{{.Names}}")`;
        try {
          names = await shell(cmd);
        } catch (e) {
          if (e.message.includes("requires at least 1 argument")) {
            logs.warn(`No containers stopped by the "${cmd}" command`);
          } else {
            logs.error("Error stopping containers on disk usage daemon", e);
          }
        }

        // Format the names output to display the exact list of stopped containers
        const stoppedContainerNames = names && typeof names === "string" ? names.split(/\r?\n/g) : [];
        const stoppedDnpNames = stoppedContainerNames.map((name) =>
          name.replace(/(DAppNodePackage-)|(DAppNodeCore-)/g, "")
        );
        const stoppedDnpNameList = stoppedDnpNames.join(", ");

        logs.warn(
          `WARNING: DAppNode has stopped ${threshold.containersDescription} (${stoppedDnpNameList}) after the disk space reached a ${threshold.id}`
        );

        eventBus.notification.emit({
          id: "diskSpaceRanOut-stoppedPackages",
          type: "danger",
          title: `Disk space is running out, ${threshold.id.split(" ")[0]}`,
          body: [
            `Available disk space is less than a ${threshold.id}.`,
            `To prevent your DAppNode from becoming unusable ${threshold.containersDescription} where stopped.`,
            stoppedDnpNames.map((dnpName) => ` - ${prettyDnpName(dnpName)}`).join("\n"),
            `Please, free up enough disk space and start them again.`
          ].join("\n\n")
        });

        // Emit packages update
        eventBus.requestPackages.emit();
      } else if (diskAvailableKBytes > 1.2 * threshold.kb) {
        // If there is again enough free space, allow packages to be stopped
        // if disk space runs out agains
        if (thresholdIsActive) db.diskUsageThreshold.set(threshold.id, false);
      }
    }
  } catch (e) {
    logs.error(`Error monitoring disk usage`, e);
  }
}

/**
 * Disk usage daemon.
 * Prevents disk usage from getting full by stopping non-essential packages
 */
export function startDiskUsageDaemon(signal: AbortSignal): void {
  runAtMostEvery(monitorDiskUsage, params.CHECK_DISK_USAGE_DAEMON_INTERVAL, signal);
}
