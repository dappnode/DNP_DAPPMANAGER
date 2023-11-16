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

const StatsCardContainer: React.FunctionComponent<{
  children: React.ReactNode;
  title: string;
  usage?: boolean;
}> = ({ children, title, usage = true}) => {
  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{title}</span>{usage===true && <span className="usage">usage</span>} 
      </div>
      {children}
    </Card>
  );
};

function StatsCardOk({ percent, text }: { percent: number; text?: string }) {
  const value = Math.round(percent);

  return (
    <>
      <ProgressBar
        variant={parseVariant(value)}
        now={value}
        label={value + "%"}
      />
      {text ? <div className="text">{text}</div> : null}
    </>
  );
}

function StatsCardError({ error }: { error: Error }) {
  return <Ok msg={error.message} style={{ margin: "auto" }} />;
}

function StatsCardLoading() {
  return <Ok msg={"Loading..."} loading={true} style={{ margin: "auto" }} />;
}

export function HostStats() {
  const cpuStats = useApi.statsCpuGet();
  const memoryStats = useApi.statsMemoryGet();
  const diskStats = useApi.statsDiskGet();
  const hostUptime = useApi.getHostUptime();

  useEffect(() => {
    const interval = setInterval(() => {
      cpuStats.revalidate();
      diskStats.revalidate();
      memoryStats.revalidate();
      hostUptime.revalidate();
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats, diskStats, memoryStats, hostUptime]);

  return (
    <div className="dashboard-cards">
      <StatsCardContainer title={"cpu"}>
        {cpuStats.data ? (
          <StatsCardOk percent={cpuStats.data.usedPercentage} />
        ) : cpuStats.error ? (
          <StatsCardError error={cpuStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      <StatsCardContainer title={"memory"}>
        {memoryStats.data ? (
          <StatsCardOk
            percent={memoryStats.data.usedPercentage}
            text={
              humanFileSize(memoryStats.data.used) +
              " / " +
              humanFileSize(memoryStats.data.total)
            }
          />
        ) : memoryStats.error ? (
          <StatsCardError error={memoryStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      <StatsCardContainer title={"disk"}>
        {diskStats.data ? (
          <StatsCardOk
            percent={diskStats.data.usedPercentage}
            text={
              humanFileSize(diskStats.data.used) +
              " / " +
              humanFileSize(diskStats.data.total)
            }
          />
        ) : diskStats.error ? (
          <StatsCardError error={diskStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      <StatsCardContainer title={"uptime"} usage={false}>
        {hostUptime.data ? (
          hostUptime.data
        ) : hostUptime.error ? (
          <StatsCardError error={hostUptime.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>
    </div>
  );
}
