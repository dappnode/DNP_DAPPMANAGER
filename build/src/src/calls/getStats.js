const shellExec = require("utils/shell");
const logs = require("logs.js")(module);

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
  let cpuUsedPercent;
  try {
    const cpuRatioRaw = await shellExec(
      `grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'`
    );
    cpuUsedPercent = isNaN(cpuRatioRaw) ? null : `${parseInt(cpuRatioRaw)}%`;
  } catch (e) {
    logs.warn(`Error fetching memUsedRatio: ${e.stack}`);
  }

  let memUsedPercent;
  try {
    const memTotal = await shellExec(
      `free / | awk 'NR==2 { print $2}'`,
      true
    ).catch(() => null);
    const memUsed = await shellExec(
      `free / | awk 'NR==3 { print $3}'`,
      true
    ).catch(() => null);
    memUsedPercent = `${Math.floor(
      (100 * parseInt(memUsed)) / parseInt(memTotal)
    )}%`;
  } catch (e) {
    logs.warn(`Error fetching memUsedRatio: ${e.stack}`);
  }

  let diskUsedPercent;
  try {
    const disk = await shellExec(`df / | awk 'NR>1 { print $5}'`, true);
    diskUsedPercent = disk.trim();
  } catch (e) {
    logs.warn(`Error fetching diskUsedPercent: ${e.stack}`);
  }

  return {
    message: `Checked stats of this DAppNode server`,
    result: {
      cpu: cpuUsedPercent,
      memory: memUsedPercent,
      disk: diskUsedPercent
    }
  };
};

module.exports = getStats;
