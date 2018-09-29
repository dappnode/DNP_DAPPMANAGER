const shellExec = require('../utils/shell');
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
    const mem = await si.mem();
    const disk = await shellExec(`df / | awk 'NR>1 { print $5}'`, true);

    return {
        message: `Checked stats of this DAppNode server`,
        result: {
            cpu: Math.floor(cpu.currentload)+'%',
            memory: Math.floor(100*mem.available/mem.total)+'%',
            disk: disk.trim(),
        },
    };
};


module.exports = getStats;

