const os = require("os");
const shellExec = require("utils/shell");
const logs = require("logs.js")(module);

// Cache static values
const numCores = os.cpus().length;

/**
 * Returns the current disk space available of a requested path
 *
 * @returns {object} status = {
 *   cpu: "35%", {string}
 *   memory: "46%", {string}
 *   disk: "57%", {string}
 * }
 */
const getStats = async () => {
  const cpuUsedPercent = await wrapErrors(async () => {
    return getDiskPercent();
  }, "cpuUsedPercent");

  const memUsedPercent = await wrapErrors(async () => {
    const memTotal = await shellExec(`free / | awk 'NR==2 { print $2}'`, true);
    const memUsed = await shellExec(`free / | awk 'NR==3 { print $3}'`, true);
    return Math.floor((100 * parseInt(memUsed)) / parseInt(memTotal)) + "%";
  }, "memUsedPercent");

  const diskUsedPercent = await wrapErrors(async () => {
    const disk = await shellExec(`df / | awk 'NR>1 { print $5}'`, true);
    return (disk || "").trim();
  }, "diskUsedPercent");

  return {
    message: `Checked stats of this DAppNode server`,
    result: {
      cpu: cpuUsedPercent,
      memory: memUsedPercent,
      disk: diskUsedPercent
    }
  };
};

// Utils

/**
 * Uses nodejs native os.loadavg, which returns three factors
 * [0.124352, 0.16262, 0.32514]
 * [1 min, 5 min, 15 min] averages
 * This util takes only the 1min and limits it to 100%
 * @returns {string} cpu usage percent "36%"
 */
function getDiskPercent() {
  let cpuFraction = os.loadavg()[0] / numCores;
  if (cpuFraction > 1) cpuFraction = 1;
  return Math.round(cpuFraction * 100) + "%";
}

/**
 * Wraps the shell calls to return null in case of error
 * @param {function} fn async getter
 * @param {string} name for the message
 */
async function wrapErrors(fn, name) {
  try {
    return await fn();
  } catch (e) {
    logs.warn(`Error fetching ${name}: ${e.stack}`);
  }
}

module.exports = getStats;
