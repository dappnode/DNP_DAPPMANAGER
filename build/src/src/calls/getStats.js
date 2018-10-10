const shellExec = require('utils/shell');
const si = require('systeminformation');

/**
 * Returns the current disk space available of a requested path
 *
 * @return {Object} A formated success message.
 * result: status =
 *   {
 *     cpu, <String>
 *     memory, <String>
 *     disk, <String>
 *   }
 */
const getStats = async () => {
    const cpu = await si.currentLoad();
    const disk = await shellExec(`df / | awk 'NR>1 { print $5}'`, true);
    // Attempt two mem fetchs
    let memUsedRatio;
    const memObj = await si.mem();
    const memTotal = await shellExec(`free / | awk 'NR==2 { print $2}'`, true).catch(() => null);
    const memUsed = await shellExec(`free / | awk 'NR==3 { print $3}'`, true).catch(() => null);
    if (memObj && memObj.available && memObj.total) {
        memUsedRatio = Math.floor(100*memObj.available/memObj.total)+'%';
    } else if (memUsed && memTotal) {
        memUsedRatio = Math.floor(100*memUsed/memTotal)+'%';
    }

    return {
        message: `Checked stats of this DAppNode server`,
        result: {
            cpu: cpu.currentload ? Math.floor(cpu.currentload)+'%' : null,
            memory: memUsedRatio,
            disk: disk.trim(),
        },
    };
};


module.exports = getStats;

