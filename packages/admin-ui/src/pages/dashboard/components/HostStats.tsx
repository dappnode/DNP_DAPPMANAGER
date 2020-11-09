import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

function percentageMemoryUsed(memUsed: string, memTotal: string): string {
  return (
    Math.round((parseInt(memUsed) * 100) / parseInt(memTotal)) + "%".toString()
  );
}

/**
 *
 */
function kiloBytesToGigaBytes(kiloBytes: number): number {
  // 1 Kilobytes = 9.537×10-7 Gigabytes
  const gigaBytes = Math.round(kiloBytes * 9.537 * Math.pow(10, -7));
  return gigaBytes;
}

function DiskStats({
  diskPercentage,
  diskUsed
}: {
  diskPercentage: string;
  diskUsed: string;
}) {
  const used = kiloBytesToGigaBytes(parseInt(diskUsed));
  const total =
    used +
    Math.round(
      (kiloBytesToGigaBytes(parseInt(diskUsed)) * 100) /
        parseInt(diskPercentage)
    );
  return (
    <p>
      {used}GB/
      {total}
      GB
    </p>
  );
}

function StatsCard({
  id,
  percent,
  diskUsed
}: {
  id: string;
  percent: string;
  diskUsed?: string;
}) {
  const value = parseInt(percent);

  if (id === "disk" && diskUsed) {
    return (
      <Card className="stats-card">
        <div className="header">
          <span className="id">{id}</span> <span className="usage">usage</span>
        </div>
        <ProgressBar
          variant={parseVariant(value)}
          now={value}
          label={percent}
        />
        <DiskStats diskPercentage={percent} diskUsed={diskUsed} />
      </Card>
    );
  }
  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{id}</span> <span className="usage">usage</span>
      </div>
      <ProgressBar variant={parseVariant(value)} now={value} label={percent} />
    </Card>
  );
}
export function HostStats() {
  const cpuStats = useApi.getCPUStats();
  const memoryStats = useApi.getMemoryStats();
  const diskStats = useApi.getDiskStats();

  useEffect(() => {
    const interval = setInterval(cpuStats.revalidate, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats]);

  useEffect(() => {
    const interval = setInterval(diskStats.revalidate, 1000);
    // eslint-disable-next-line no-console
    console.log(diskStats);
    return () => {
      clearInterval(interval);
    };
  }, [diskStats]);

  useEffect(() => {
    const interval = setInterval(memoryStats.revalidate, 1000);
    // eslint-disable-next-line no-console
    console.log(memoryStats);
    return () => {
      clearInterval(interval);
    };
  }, [memoryStats]);

  return (
    <div className="dashboard-cards">
      {cpuStats.data?.used ? (
        <StatsCard key={0} id={"cpu"} percent={cpuStats.data?.used} />
      ) : (
        <StatsCard key={0} id={"cpu"} percent={"0"} />
      )}
      {diskStats.data?.usepercentage && diskStats.data.used ? (
        <StatsCard
          key={1}
          id={"disk"}
          percent={diskStats.data?.usepercentage}
          diskUsed={diskStats.data.used}
        />
      ) : (
        <StatsCard key={1} id={"disk"} percent={"0"} />
      )}
      {memoryStats.data?.memUsed && memoryStats.data?.memTotal ? (
        <StatsCard
          key={2}
          id={"memory"}
          percent={percentageMemoryUsed(
            memoryStats.data.memUsed,
            memoryStats.data.memTotal
          )}
        />
      ) : (
        <StatsCard key={2} id={"cpu"} percent={"0"} />
      )}
    </div>
  );
}
