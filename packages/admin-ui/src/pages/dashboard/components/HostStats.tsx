import React, { useEffect } from "react";
import { useApi } from "api";
import humanFileSize from "../../../utils/humanFileSize";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

function percentageMemoryUsed(memUsed: string, memTotal: string): string {
  return (
    Math.round((parseInt(memUsed) * 100) / parseInt(memTotal)).toString() + "%"
  );
}

function DiskStats({
  diskUsed,
  diskAvailable
}: {
  diskUsed: string;
  diskAvailable: string;
}) {
  const used = humanFileSize(parseInt(diskUsed) * 1024);
  const available = humanFileSize(parseInt(diskAvailable) * 1024);
  if (typeof used === "string" && typeof available === "string") {
    const total = (parseInt(used) + parseInt(available)).toString() + "GB";
    return (
      <p className="disk-usage">
        {used}/{total}
      </p>
    );
  }
  return <p>Info not available</p>;
}

function StatsCard({
  id,
  percent,
  diskUsed,
  diskAvailable
}: {
  id: string;
  percent: string;
  diskUsed?: string;
  diskAvailable?: string;
}) {
  const value = parseInt(percent);

  if (id === "disk" && diskUsed && diskAvailable) {
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
        <DiskStats diskUsed={diskUsed} diskAvailable={diskAvailable} />
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
    return () => {
      clearInterval(interval);
    };
  }, [diskStats]);

  useEffect(() => {
    const interval = setInterval(memoryStats.revalidate, 1000);
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
      {diskStats.data?.usepercentage &&
      diskStats.data.used &&
      diskStats.data.available ? (
        <StatsCard
          key={1}
          id={"disk"}
          percent={diskStats.data.usepercentage}
          diskUsed={diskStats.data.used}
          diskAvailable={diskStats.data.available}
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
