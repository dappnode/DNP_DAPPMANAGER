import React, { useEffect } from "react";
import { useApi } from "api";
import Card from "components/Card";
import ProgressBar from "react-bootstrap/ProgressBar";
import humanFileSize from "utils/humanFileSize";
import Ok from "../../../components/Ok";

function parseVariant({
  value,
  danger = 90,
  warning = 75,
  infoCard
}: {
  value: number;
  danger?: number;
  warning?: number;
  infoCard: boolean;
}) {
  if (infoCard) return "info";
  if (value > danger) return "danger";
  if (value > warning) return "warning";
  return "success";
}

const StatsCardContainer: React.FunctionComponent<{
  children: React.ReactNode;
  title: string;
  usage?: boolean;
}> = ({ children, title }) => {
  return (
    <Card className="stats-card">
      <div className="header">
        <span className="id">{title}</span>
      </div>
      {children}
    </Card>
  );
};

function StatsCardOk({
  percent,
  label,
  text,
  max,
  danger,
  warning,
  infoCard = false
}: {
  percent: number;
  label: "%" | "ºC";
  text?: string;
  max?: number;
  danger?: number;
  warning?: number;
  infoCard?: boolean;
}) {
  let value: number;
  if (label === "%") value = Math.round(percent);
  else value = percent;

  return (
    <>
      <ProgressBar
        variant={parseVariant({ value, danger, warning, infoCard })}
        max={max || 100}
        now={value}
        label={value + label}
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
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [cpuStats, diskStats, memoryStats, hostUptime]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        hostUptime.revalidate();
      },
      60 * 5 * 1000
    );
    return () => {
      clearInterval(interval);
    };
  }, [hostUptime]);

  return (
    <div className="dashboard-cards">
      <StatsCardContainer title={"cpu usage"}>
        {cpuStats.data ? (
          <StatsCardOk
            percent={cpuStats.data.usedPercentage}
            label={"%"}
            text={`Number of cores ${cpuStats.data.numberOfCores}`}
          />
        ) : cpuStats.error ? (
          <StatsCardError error={cpuStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      {cpuStats.data?.temperatureAverage ? (
        <StatsCardContainer title={"cpu temperature"}>
          {" "}
          <StatsCardOk
            percent={cpuStats.data.temperatureAverage}
            text="Average temperature of the CPU cores"
            label={"ºC"}
            max={115} // cpu temperature above 100/110 triggers automatic shutdowns in intel NUCs
            danger={95}
            warning={85}
          />
        </StatsCardContainer>
      ) : cpuStats.error ? (
        <StatsCardContainer title={"cpu temperature"}>
          <StatsCardError error={cpuStats.error} />
        </StatsCardContainer>
      ) : null}

      <StatsCardContainer title={"memory"}>
        {memoryStats.data ? (
          <StatsCardOk
            percent={memoryStats.data.usedPercentage}
            label="%"
            text={humanFileSize(memoryStats.data.used) + " / " + humanFileSize(memoryStats.data.total)}
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
            label="%"
            text={humanFileSize(diskStats.data.used) + " / " + humanFileSize(diskStats.data.total)}
          />
        ) : diskStats.error ? (
          <StatsCardError error={diskStats.error} />
        ) : (
          <StatsCardLoading />
        )}
      </StatsCardContainer>

      <StatsCardContainer title={"uptime"}>
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
