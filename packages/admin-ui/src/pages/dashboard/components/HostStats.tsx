import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";
import humanFileSize from "utils/humanFileSize";
import Ok from "../../../components/Ok";

function parseVariant(value: number) {
  if (value > 90) return "danger";
  if (value > 75) return "warning";
  return "success";
}

function StatsCard({
  title,
  percent,
  text
}: {
  title: string;
  percent: number;
  text?: string;
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
      {text ? <div className="text">{text}</div> : null}
    </Card>
  );
}

function okStatsCard(stat: string, ok?: boolean): JSX.Element {
  return ok ? (
    <Ok
      msg={`Loading ${stat} usage`}
      loading={true}
      style={{ margin: "auto" }}
    />
  ) : (
    <Ok msg={`Couldn't get ${stat} stats`} style={{ margin: "auto" }} />
  );
}

export function HostStats() {
  const cpu = "cpu";
  const disk = "disk";
  const memory = "memory";
  const cpuStats = useApi.statsCpuGet();
  const memoryStats = useApi.statsMemoryGet();
  const diskStats = useApi.statsDiskGet();

  useEffect(() => {
    const interval = setInterval(() => {
      cpuStats.revalidate();
      diskStats.revalidate();
      memoryStats.revalidate();
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats, diskStats, memoryStats]);

  return (
    <div className="dashboard-cards">
      {cpuStats.data ? (
        <StatsCard key={0} title={cpu} percent={cpuStats.data.usedFraction} />
      ) : cpuStats.error ? (
        okStatsCard(cpu, false)
      ) : (
        okStatsCard(cpu, true)
      )}

      {diskStats.data ? (
        <StatsCard
          key={1}
          title={disk}
          percent={diskStats.data.useFraction}
          text={
            humanFileSize(parseInt(diskStats.data.used)) +
            " / " +
            humanFileSize(parseInt(diskStats.data.bBlocks))
          }
        />
      ) : diskStats.error ? (
        okStatsCard(disk, false)
      ) : (
        okStatsCard(disk, true)
      )}

      {memoryStats.data ? (
        <StatsCard
          key={2}
          title={memory}
          percent={memoryStats.data.useFraction}
          text={
            humanFileSize(parseInt(memoryStats.data.swapUsed)) +
            " / " +
            humanFileSize(parseInt(memoryStats.data.memTotal))
          }
        />
      ) : memoryStats.error ? (
        okStatsCard(memory, false)
      ) : (
        okStatsCard(memory, true)
      )}
    </div>
  );
}
