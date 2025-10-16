import { useApi } from "api";
import { useEffect } from "react";
import humanFileSize from "utils/humanFileSize";

export function useSystemHealth() {
  const cpuStats = useApi.statsCpuGet();
  const memoryStats = useApi.statsMemoryGet();
  const diskStats = useApi.statsDiskGet();
  const hostUptime = useApi.getHostUptime();

  // Just showing "loading" for the first load
  const isLoading =
    (cpuStats.isValidating && !cpuStats.data) ||
    (memoryStats.isValidating && !memoryStats.data) ||
    (diskStats.isValidating && !diskStats.data) ||
    (hostUptime.isValidating && !hostUptime.data);

  useEffect(() => {
    const interval = setInterval(() => {
      cpuStats.revalidate();
      diskStats.revalidate();
      memoryStats.revalidate();
    }, 5 * 1000); // every 5 seconds
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats, diskStats, memoryStats, hostUptime]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        hostUptime.revalidate();
      },
      60 * 5 * 1000 // every 5 minutes
    );
    return () => {
      clearInterval(interval);
    };
  }, [hostUptime]);

  return {
    cpuUsage: cpuStats.data ? Math.floor(cpuStats.data.usedPercentage) : 0,
    cpuTemp: cpuStats.data ? Math.floor(cpuStats.data.temperatureAverage) : 0,
    memoryUsed: memoryStats.data ? humanFileSize(memoryStats.data.used, false, 0) : null,
    memoryTotal: memoryStats.data ? humanFileSize(memoryStats.data.total) : null,
    memoryPercentage: memoryStats.data ? Math.floor(memoryStats.data.usedPercentage) : 0,
    diskUsed: diskStats.data ? humanFileSize(diskStats.data.used, false) : null,
    diskTotal: diskStats.data ? humanFileSize(diskStats.data.total) : null,
    diskPercentage: diskStats.data ? Math.floor(diskStats.data.usedPercentage) : 0,
    uptime: hostUptime.data ? formatUptime(hostUptime.data) : null,
    isLoading
  };
}

// Formats uptime string from "up 1 week, 2 days, 3 hours, 4 minutes" to "up 1w 2d 3h 4m"
function formatUptime(uptime: string): string {
  if (!uptime) return "";
  const clean = uptime.replace(/^up\s*/, "");
  return clean
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      return trimmed
        .replace(/(\d+)\s*weeks?/, "$1w")
        .replace(/(\d+)\s*days?/, "$1d")
        .replace(/(\d+)\s*hours?/, "$1h")
        .replace(/(\d+)\s*minutes?/, "$1m");
    })
    .join(" ");
}
