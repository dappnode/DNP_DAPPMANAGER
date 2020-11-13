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

const StatsCardContainer: React.FunctionComponent<{ title: string }> = ({
  children,
  title
}) => {
  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{title}</span> <span className="usage">usage</span>
      </div>
      {children}
    </Card>
  );
};

function StatsCardOk({ percent, text }: { percent: number; text?: string }) {
  const value = Math.round(percent * 100);

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
      <StatsCardContainer title={"cpu"}>
        {cpuStats.data ? (
          <StatsCardOk percent={cpuStats.data.usedFraction} />
        ) : cpuStats.error ? (
          <StatsCardError error={cpuStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      <StatsCardContainer title={"disk"}>
        {memoryStats.data ? (
          <StatsCardOk
            percent={memoryStats.data.useFraction}
            text={
              humanFileSize(parseInt(memoryStats.data.swapUsed)) +
              " / " +
              humanFileSize(parseInt(memoryStats.data.memTotal))
            }
          />
        ) : memoryStats.error ? (
          <StatsCardError error={memoryStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      <StatsCardContainer title={"memory"}>
        {diskStats.data ? (
          <StatsCardOk
            percent={diskStats.data.useFraction}
            text={
              humanFileSize(parseInt(diskStats.data.used)) +
              " / " +
              humanFileSize(parseInt(diskStats.data.bBlocks))
            }
          />
        ) : diskStats.error ? (
          <StatsCardError error={diskStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>
    </div>
  );
}
