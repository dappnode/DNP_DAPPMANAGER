const shellExec = require('utils/shell');
const dockerList = require('modules/dockerList');
const logs = require('logs.js')(module);

const diskAvailableThresholdKB = 1e6; // ~ 1 GB
const monitoringInterval = 60 * 1000; // (ms)

let stoppedPackages = false;

/**
 * Monitors disk usage of this DAppNode
 * If disk usage reaches a critical level (< 1GB)
 * it will stop all non cores + etchain + ipfs
 *
 * @return {*}
 */
async function monitorDiskUsage() {
    try {
        const diskAvailable = await shellExec(`df -k / | awk 'NR>1 { print $4}'`, true);
        const diskAvailableBytes = parseInt(diskAvailable.trim());
        if (diskAvailableBytes < diskAvailableThresholdKB) {
            // If packages have already been stopped, skip
            if (stoppedPackages) return;
            // Stop all non cores + etchain + ipfs
            const dnpList = await dockerList.listContainers();
            const packagesToStop = dnpList
            .filter((dnp) =>
                dnp.isDNP
                || dnp.name === 'ethchain.dnp.dappnode.eth'
                || dnp.name === 'ipfs.dnp.dappnode.eth'
            )
            .map((dnp) => dnp.packageName)
            .join(' ');
            await shellExec(`docker stop ${packagesToStop}`);
            logs.warn(`WARNING: DAppNode has preventively stopped these containers to prevent the disk from running out of space: \n${packagesToStop}`);
            stoppedPackages = true;
        } else if (diskAvailableBytes > 1.2*diskAvailableThresholdKB) {
            // If there is again enough free space, allow packages to be stopped
            // if disk space runs out agains
            if (stoppedPackages) stoppedPackages = false;
        }
    } catch (e) {
        logs.error(`Error monitoring disk usage: ${e.stack}`);
    }
}

setInterval(async () => {
    monitorDiskUsage();
}, monitoringInterval);


module.exports = monitorDiskUsage;
