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
}> = ({ children, title }) => {
  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{title}</span>{" "}
      </div>
      {children}
    </Card>
  );
};

function StatsCardOk({ value, text, valueType }: { value: number; text?: string; valueType: string }) {
  const valueBar = Math.round(value);

  return (
    <>
      <ProgressBar
        variant={parseVariant(value)}
        now={valueBar}
        label={ valueBar + valueType }
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
  const sensorsData = useApi.sensorsDataGet();

  useEffect(() => {
    const interval = setInterval(() => {
      cpuStats.revalidate();
      diskStats.revalidate();
      memoryStats.revalidate();
      sensorsData.revalidate();
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats, diskStats, memoryStats, sensorsData]);

  return (
    <div className="dashboard-cards">
      <StatsCardContainer title={"cpu"}>
        {cpuStats.data ? (
          <StatsCardOk
            value={cpuStats.data.usedPercentage}
            valueType="%"
          />
        ) : cpuStats.error ? (
          <StatsCardError error={cpuStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      <StatsCardContainer title={"memory"}>
        {memoryStats.data ? (
          <StatsCardOk
            value={memoryStats.data.usedPercentage}
            text={
              humanFileSize(memoryStats.data.used) +
              " / " +
              humanFileSize(memoryStats.data.total)
            }
            valueType="%"
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
            value={diskStats.data.usedPercentage}
            text={
              humanFileSize(diskStats.data.used) +
              " / " +
              humanFileSize(diskStats.data.total)
            }
            valueType="%"
          />
        ) : diskStats.error ? (
          <StatsCardError error={diskStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      {sensorsData.data !== null && (
        <StatsCardContainer title={"cpu temperature"}>
          {sensorsData.data ? (
            <StatsCardOk value={sensorsData.data} valueType="°C" />
          ) : (
            <StatsCardLoading />
          )}
        </StatsCardContainer>
      )}
    </div>
  );
}
