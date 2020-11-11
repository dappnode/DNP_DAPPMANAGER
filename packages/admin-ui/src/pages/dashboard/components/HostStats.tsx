import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";
import humanFileSize from "utils/humanFileSize";
import Loading from "../../../components/Loading";
import ErrorView from "../../../components/ErrorView";
import { HostStatDisk } from "common";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

/**
 * Returns an element to be rendered containing diskUsed/diskTotal. If not returns 0/0
 * @param  param0 Parameters of the diskUsed and diskTotal provided by statsDiskGet
 */
function DiskStats({ disk }: { disk: HostStatDisk }) {
  return (
    <p className="disk-usage">
      {humanFileSize(parseInt(disk.used))}/
      {humanFileSize(parseInt(disk.bBlocks))}
    </p>
  );
}

function StatsCard({
  title,
  percent,
  disk
}: {
  title: string;
  percent: number;
  disk?: HostStatDisk;
}) {
  const value = Math.round(percent * 100);

  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{title}</span> <span className="usage">usage</span>
      </div>
      <ProgressBar
        variant={parseVariant(value)}
        now={value}
        label={value + "%"}
      />
      {disk ? <DiskStats disk={disk} /> : null}
    </Card>
  );
}
export function HostStats() {
  const cpuStats = useApi.statsCpuGet();
  const memoryStats = useApi.statsMemoryGet();
  const diskStats = useApi.statsDiskGet();

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
      {cpuStats.data ? (
        <StatsCard key={0} title={"cpu"} percent={cpuStats.data.usedFraction} />
      ) : cpuStats.error ? (
        <ErrorView error={cpuStats.error} />
      ) : (
        <Loading steps={["Loading cpu usage"]} />
      )}
      {diskStats.data ? (
        <StatsCard
          key={1}
          title={"disk"}
          percent={diskStats.data.useFraction}
          disk={diskStats.data}
        />
      ) : diskStats.error ? (
        <ErrorView error={diskStats.error} />
      ) : (
        <Loading steps={["Loading disk usage"]} />
      )}
      {memoryStats.data ? (
        <StatsCard
          key={2}
          title={"memory"}
          percent={memoryStats.data.useFraction}
        />
      ) : memoryStats.error ? (
        <ErrorView error={memoryStats.error} />
      ) : (
        <Loading steps={["Loading memory usage"]} />
      )}
    </div>
  );
}
