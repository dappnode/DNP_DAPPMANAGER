import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";
import humanFileSize from "utils/humanFileSize";
import Loading from "../../../components/Loading";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

/**
 * Returns an element to be rendered containing diskUsed/diskTotal. If not returns 0/0
 * @param  param0 Parameters of the diskUsed and diskTotal provided by statsDiskGet
 */
function DiskStats({
  diskUsed,
  diskTotal
}: {
  diskUsed: string;
  diskTotal: string;
}) {
  return (
    <p className="disk-usage">
      {humanFileSize(parseInt(diskUsed))}/{humanFileSize(parseInt(diskTotal))}
    </p>
  );
}

function StatsCard({
  title,
  percent,
  diskUsed,
  diskTotal
}: {
  title: string;
  percent: string;
  diskUsed?: string;
  diskTotal?: string;
}) {
  const value = parseInt(percent);

  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{title}</span> <span className="usage">usage</span>
      </div>
      <ProgressBar variant={parseVariant(value)} now={value} label={percent} />
      {diskUsed && diskTotal ? (
        <DiskStats diskUsed={diskUsed} diskTotal={diskTotal} />
      ) : null}
    </Card>
  );
}
export function HostStats() {
  const cpuStats = useApi.statsCpuGet();
  const memoryStats = useApi.statsMemoryGet();
  const diskStats = useApi.statsDiskGet();

  useEffect(() => {
    const interval = setInterval(cpuStats.revalidate, 4 * 1000);
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
      {cpuStats.data ? (
        <StatsCard key={0} title={"cpu"} percent={cpuStats.data.used} />
      ) : cpuStats.error ? (
        <StatsCard key={0} title={"cpu"} percent={"1"} />
      ) : (
        <Loading steps={["Loading cpu usage"]} />
      )}
      {diskStats.data ? (
        <StatsCard
          key={1}
          title={"disk"}
          percent={diskStats.data.usePercentage}
          diskUsed={diskStats.data.used}
          diskTotal={diskStats.data.bBlocks}
        />
      ) : cpuStats.error ? (
        <StatsCard key={1} title={"disk"} percent={"0"} />
      ) : (
        <Loading steps={["Loading disk usage"]} />
      )}
      {memoryStats.data ? (
        <StatsCard
          key={2}
          title={"memory"}
          percent={memoryStats.data.usePercentage}
        />
      ) : memoryStats.error ? (
        <StatsCard key={2} title={"memory"} percent={"0"} />
      ) : (
        <Loading steps={["Loading memory usage"]} />
      )}
    </div>
  );
}
