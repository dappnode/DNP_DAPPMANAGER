import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";
import humanFileSize from "utils/humanFileSize";
import Loader from "react-loader-spinner";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

function LoadingIndicator() {
  return (
    <Card className="stats-card">
      <div className="loading">
        <Loader type="ThreeDots" color="#2BAD60" height={100} width={100} />
      </div>
    </Card>
  );
}

function DiskStats({
  percentage,
  diskUsed
}: {
  percentage: string;
  diskUsed: string;
}) {
  const used = humanFileSize(parseInt(diskUsed));
  const available = humanFileSize(
    (parseInt(diskUsed) * 100) / parseInt(percentage)
  );
  if (typeof used === "string" && typeof available === "string") {
    const total = (parseInt(used) + parseInt(available)).toString() + "GB";
    return (
      <p className="disk-usage">
        {used}/{total}
      </p>
    );
  }
  return <p className="disk-usage">Info not available</p>;
}

function StatsCard({
  title,
  percent,
  diskUsed
}: {
  title: string;
  percent: string;
  diskUsed?: string;
}) {
  const value = parseInt(percent);

  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{title}</span> <span className="usage">usage</span>
      </div>
      <ProgressBar variant={parseVariant(value)} now={value} label={percent} />
      {diskUsed ? <DiskStats diskUsed={diskUsed} percentage={percent} /> : null}
    </Card>
  );
}
export function HostStats() {
  const cpuStats = useApi.getCPUStats();
  const memoryStats = useApi.getMemoryStats();
  const diskStats = useApi.getDiskStats();

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
        <LoadingIndicator />
      )}
      {diskStats.data ? (
        <StatsCard
          key={1}
          title={"disk"}
          percent={diskStats.data.usePercentage}
          diskUsed={diskStats.data.used}
        />
      ) : cpuStats.error ? (
        <StatsCard key={1} title={"disk"} percent={"0"} />
      ) : (
        <LoadingIndicator />
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
        <LoadingIndicator />
      )}
    </div>
  );
}
