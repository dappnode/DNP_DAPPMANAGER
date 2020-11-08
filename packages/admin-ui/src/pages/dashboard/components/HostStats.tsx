import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

function StatsCard({ id, percent }: { id: string; percent: string }) {
  const value = parseInt(percent);
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
        <StatsCard key={0} id={"cpu"} percent={"10"} />
      )}
      {diskStats.data?.used ? (
        <StatsCard key={1} id={"disk"} percent={diskStats.data?.used} />
      ) : (
        <StatsCard key={1} id={"disk"} percent={"10"} />
      )}
      {memoryStats.data?.memUsed ? (
        <StatsCard key={2} id={"memory"} percent={memoryStats.data.memUsed} />
      ) : (
        <StatsCard key={2} id={"cpu"} percent={"10"} />
      )}
    </div>
  );
}
