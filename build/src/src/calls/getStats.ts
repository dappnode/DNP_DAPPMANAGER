import { ReturnData } from "../route-types/getStats";
import os from "os";
import shellExec from "../utils/shell";
import Logs from "../logs";
import osu from "node-os-utils";
import { RpcHandlerReturnWithResult } from "../types";
const logs = Logs(module);

// Cache static values
const numCores = os.cpus().length;

/**
 * Returns relevant host machine stats such as disk space, memory, cpu, etc
 */
export default async function getStats(): RpcHandlerReturnWithResult<
  ReturnData
> {
  const cpuUsedPercent = await wrapErrors(async () => {
    const cpuPercentage = await osu.cpu.usage(5000); // 10.38
    return Math.round(cpuPercentage) + "%";
  }, "cpuUsedPercent");

  const memUsedPercent = await wrapErrors(async () => {
    const memTotal = await shellExec(`free / | awk 'NR==2 { print $2}'`);
    const memUsed = await shellExec(`free / | awk 'NR==3 { print $3}'`);
    return Math.floor((100 * parseInt(memUsed)) / parseInt(memTotal)) + "%";
  }, "memUsedPercent");

  const diskUsedPercent = await wrapErrors(async () => {
    const disk = await shellExec(`df / | awk 'NR>1 { print $5}'`);
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
}

// Utils

/**
 * Uses nodejs native os.loadavg, which returns three factors
 * [0.124352, 0.16262, 0.32514]
 * [1 min, 5 min, 15 min] averages
 * This util takes only the 1min and limits it to 100%
 * @returns {string} cpu usage percent "36%"
 */
function getCpuLoad(): string {
  let cpuFraction = os.loadavg()[0] / numCores;
  if (cpuFraction > 1) cpuFraction = 1;
  return Math.round(cpuFraction * 100) + "%";
}

/**
 * Wraps the shell calls to return null in case of error
 * @param {function} fn async getter
 * @param {string} name for the message
 */
async function wrapErrors<R>(
  fn: () => Promise<R>,
  name: string
): Promise<R | undefined> {
  try {
    return await fn();
  } catch (e) {
    logs.warn(`Error fetching ${name}: ${e.stack}`);
  }
}
